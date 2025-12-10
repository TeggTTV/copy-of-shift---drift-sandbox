import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
	process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== 'PATCH') {
		return res.status(405).json({ message: 'Method not allowed' });
	}

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

	const { targetUserId, action } = req.body; // action: 'accept' | 'decline'

	if (!targetUserId || !['accept', 'decline'].includes(action)) {
		return res.status(400).json({ message: 'Invalid body' });
	}

	try {
		const currentUser = await prisma.user.findUnique({
			where: { id: userId },
		});
		if (!currentUser)
			return res.status(404).json({ message: 'User not found' });

		if (!currentUser.friendRequestsReceived.includes(targetUserId)) {
			return res
				.status(400)
				.json({ message: 'No request found from this user' });
		}

		if (action === 'decline') {
			// Remove from received and sent
			await prisma.$transaction([
				prisma.user.update({
					where: { id: userId },
					data: {
						friendRequestsReceived: {
							set: currentUser.friendRequestsReceived.filter(
								(id) => id !== targetUserId
							),
						},
					},
				}),
				prisma.user.update({
					where: { id: targetUserId },
					// need to fetch target user first to filter safely, or just usage `set` requires knowing logic.
					// Simpler: use pull? Prisma mongodb supports basic push, but pull might be tricky with scalar lists in some versions?
					// Actually prisma supports atomic operations on scalar lists.
					// But `pull` is not always available?
					// Let's use `set` with filter logic or check documentation.
					// `set` is safest if we read first.
					// But we can try to "blindly" pull if supported.
					// Actually, for scalar lists in Prisma 6:
					// data: { list: { set: [..., ...] } } is common.
					// Let's do read-modify-write for safety.
					data: {
						// We can't access targetUser's list here safely without reading it.
						// But for transaction, we can just do one update first?
						// MongoDB supports $pull. Prisma exposes it?
						// `friendRequestsSent: { set: ... }`
					},
				}),
			]);

			// Let's just do it sequentially for prototype simplicity or do a proper fetch.
			// Fetch target user
			const targetUser = await prisma.user.findUnique({
				where: { id: targetUserId },
			});
			if (targetUser) {
				await prisma.user.update({
					where: { id: targetUserId },
					data: {
						friendRequestsSent: {
							set: targetUser.friendRequestsSent.filter(
								(id) => id !== userId
							),
						},
					},
				});
			}

			await prisma.user.update({
				where: { id: userId },
				data: {
					friendRequestsReceived: {
						set: currentUser.friendRequestsReceived.filter(
							(id) => id !== targetUserId
						),
					},
				},
			});

			return res.status(200).json({ message: 'Request declined' });
		} else if (action === 'accept') {
			// Add to friends, remove from requests

			// Fetch target to get their current friends
			const targetUser = await prisma.user.findUnique({
				where: { id: targetUserId },
			});
			if (!targetUser)
				return res
					.status(404)
					.json({ message: 'Target user not found' });

			await prisma.$transaction([
				prisma.user.update({
					where: { id: userId },
					data: {
						friends: { push: targetUserId },
						friendRequestsReceived: {
							set: currentUser.friendRequestsReceived.filter(
								(id) => id !== targetUserId
							),
						},
					},
				}),
				prisma.user.update({
					where: { id: targetUserId },
					data: {
						friends: { push: userId },
						friendRequestsSent: {
							set: targetUser.friendRequestsSent.filter(
								(id) => id !== userId
							),
						},
					},
				}),
			]);

			return res.status(200).json({ message: 'Friend request accepted' });
		}
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}
}
