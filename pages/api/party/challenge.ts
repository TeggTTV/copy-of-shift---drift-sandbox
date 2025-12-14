import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../utils/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET =
	process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	if (req.method !== 'POST')
		return res.status(405).json({ message: 'Method not allowed' });

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

	const { targetUserId, wager } = req.body;

	if (!targetUserId)
		return res.status(400).json({ message: 'Target user required' });

	try {
		// 1. Check if both users exist
		const user = await prisma.user.findUnique({ where: { id: userId } });
		const target = await prisma.user.findUnique({
			where: { id: targetUserId },
		});

		if (!user || !target)
			return res.status(404).json({ message: 'User not found' });

		// 2. Check Wager
		if (wager > 0 && user.money < wager) {
			return res.status(400).json({ message: 'Not enough money' });
		}

		// 3. Create Challenge Record
		await prisma.challenge.create({
			data: {
				challengerId: userId,
				targetId: targetUserId,
				wager: wager || 0,
				status: 'PENDING',
			},
		});

		// 4. Notify Target (via polling field update)
		// We can reuse friendRequestsReceived or add a new field.
		// For now, let's assume the client polls /api/party/challenges or we add it to user profile.
		// Let's add it to user profile in a separate step or just rely on a new endpoint.
		// Actually, let's just return success and implement a polling endpoint.

		return res.status(200).json({ message: 'Challenge sent' });
	} catch (e) {
		console.error(e);
		return res.status(500).json({ message: 'Server error' });
	}
}
