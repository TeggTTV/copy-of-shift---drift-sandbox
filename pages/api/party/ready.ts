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

	try {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user?.partyId)
			return res.status(400).json({ message: 'Not in a party' });

		const party = await prisma.party.findUnique({
			where: { id: user.partyId },
		});
		if (!party) return res.status(404).json({ message: 'Party not found' });

		const isReady = party.readyMemberIds.includes(userId);
		let newReadyIds = [...party.readyMemberIds];

		if (isReady) {
			newReadyIds = newReadyIds.filter((id) => id !== userId);
		} else {
			newReadyIds.push(userId);
		}

		await prisma.party.update({
			where: { id: party.id },
			data: { readyMemberIds: newReadyIds },
		});

		return res.status(200).json({ message: isReady ? 'Unready' : 'Ready' });
	} catch (e) {
		console.error(e);
		return res.status(500).json({ message: 'Server error' });
	}
}
