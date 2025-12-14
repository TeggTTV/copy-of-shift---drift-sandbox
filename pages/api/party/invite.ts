import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
	process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
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

	if (req.method === 'DELETE') {
		const { partyId } = req.body;
		try {
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			if (!user)
				return res.status(404).json({ message: 'User not found' });

			const newInvites = user.partyInvites.filter((id) => id !== partyId);

			await prisma.user.update({
				where: { id: userId },
				data: {
					partyInvites: newInvites,
				},
			});
			return res.status(200).json({ message: 'Invite removed' });
		} catch (e) {
			console.error(e);
			return res.status(500).json({ message: 'Server error' });
		}
	}

	if (req.method !== 'POST')
		return res.status(405).json({ message: 'Method not allowed' });

	// ... POST logic ...
	const { targetUserId } = req.body;

	try {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		let partyId = user?.partyId;
		if (!partyId) {
			// Create new party
			const party = await prisma.party.create({
				data: {
					hostId: userId,
					members: [userId],
					isOpen: true,
				},
			});
			partyId = party.id;

			// Update host user
			await prisma.user.update({
				where: { id: userId },
				data: { partyId: party.id },
			});
		}

		// Add partyId to target user's invites
		await prisma.user.update({
			where: { id: targetUserId },
			data: {
				partyInvites: { push: partyId },
			},
		});

		return res.status(200).json({ message: 'Invite sent' });
	} catch (e) {
		console.error(e);
		return res.status(500).json({ message: 'Server error' });
	}
}
