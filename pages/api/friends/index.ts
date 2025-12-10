import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
	process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	// Verify Token
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ message: 'Unauthorized' });
	}
	const token = authHeader.split(' ')[1];
	let userId: string;
	try {
		const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
		userId = decoded.userId;
	} catch (err) {
		return res.status(401).json({ message: 'Invalid token' });
	}

	if (req.method === 'GET') {
		try {
			const user = await prisma.user.findUnique({
				where: { id: userId },
				include: {
					// We can't include self-referencing array relations directly if they are scalar lists
					// But since they are IDs, we must fetch them manually or use aggregation.
					// In MongoDB scalar lists, Prisma doesn't support 'include' directly for string arrays in this way
					// unless we modeled it as a relation.
					// So we fetch the user, get the friend IDs, then fetch those users.
				},
			});

			if (!user)
				return res.status(404).json({ message: 'User not found' });

			// Fetch friend details
			const friends = await prisma.user.findMany({
				where: {
					id: { in: user.friends },
				},
				select: {
					id: true,
					username: true,
					level: true,
					// Online status? (Maybe just 'lastLogin')
				},
			});

			return res.status(200).json(friends);
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: 'Internal Server Error' });
		}
	}

	if (req.method === 'POST') {
		// Send Friend Request
		const { friendCode } = req.body;
		if (!friendCode)
			return res.status(400).json({ message: 'Friend code required' });

		try {
			const targetUser = await prisma.user.findUnique({
				where: { friendCode },
			});

			if (!targetUser)
				return res.status(404).json({ message: 'User not found' });
			if (targetUser.id === userId)
				return res.status(400).json({ message: 'Cannot add yourself' });

			// Check if already friends
			const currentUser = await prisma.user.findUnique({
				where: { id: userId },
			});
			if (currentUser?.friends.includes(targetUser.id)) {
				return res.status(400).json({ message: 'Already friends' });
			}

			// Check if request already sent
			if (targetUser.friendRequestsReceived.includes(userId)) {
				return res
					.status(400)
					.json({ message: 'Request already sent' });
			}

			// Update both users
			await prisma.$transaction([
				prisma.user.update({
					where: { id: userId },
					data: {
						friendRequestsSent: { push: targetUser.id },
					},
				}),
				prisma.user.update({
					where: { id: targetUser.id },
					data: {
						friendRequestsReceived: { push: userId },
					},
				}),
			]);

			return res.status(200).json({ message: 'Friend request sent' });
		} catch (error) {
			console.error(error);
			return res.status(500).json({ message: 'Internal Server Error' });
		}
	}

	if (req.method === 'DELETE') {
		const { friendId } = req.body;
		if (!friendId)
			return res.status(400).json({ message: 'Friend ID required' });

		try {
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const friend = await prisma.user.findUnique({
				where: { id: friendId },
			});

			if (!user || !friend)
				return res.status(404).json({ message: 'User not found' });

			await prisma.$transaction([
				prisma.user.update({
					where: { id: userId },
					data: {
						friends: {
							set: user.friends.filter((f) => f !== friendId),
						},
					},
				}),
				prisma.user.update({
					where: { id: friendId },
					data: {
						friends: {
							set: friend.friends.filter((f) => f !== userId),
						},
					},
				}),
			]);
			return res.status(200).json({ message: 'Friend removed' });
		} catch (e) {
			return res.status(500).json({ message: 'Error removing friend' });
		}
	}

	return res.status(405).json({ message: 'Method not allowed' });
}
