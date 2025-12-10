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

	const { partyId } = req.body;

	try {
		// Find Party
		const party = await prisma.party.findUnique({ where: { id: partyId } });
		if (!party) return res.status(404).json({ message: 'Party not found' });
		if (!party.isOpen)
			return res.status(403).json({ message: 'Party is closed' });
		if (party.members.length >= 8)
			return res.status(403).json({ message: 'Party full' });

		// Update User
		await prisma.user.update({
			where: { id: userId },
			data: {
				partyId: partyId,
				// Remove this party from invites if present
				partyInvites: {
					set:
						(
							await prisma.user.findUnique({
								where: { id: userId },
							})
						)?.partyInvites.filter((id) => id !== partyId) || [],
				},
			},
		});

		// Update Party
		await prisma.party.update({
			where: { id: partyId },
			data: { members: { push: userId } },
		});

		return res.status(200).json({ message: 'Joined party' });
	} catch (e) {
		console.error(e);
		return res.status(500).json({ message: 'Server error' });
	}
}
