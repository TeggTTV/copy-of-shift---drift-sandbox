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

	if (req.method === 'POST') {
		// Create Party / Join?
		// For simplicity: POST = Create new party (must not be in one)
		try {
			// Check if user has a party
			const existingParty = await prisma.party.findFirst({
				where: { members: { has: userId } },
			});
			if (existingParty)
				return res.status(400).json({ message: 'Already in a party' });

			const party = await prisma.party.create({
				data: {
					hostId: userId,
					members: [userId],
					isOpen: true,
				},
			});

			// Update user
			await prisma.user.update({
				where: { id: userId },
				data: { partyId: party.id },
			});

			return res.status(201).json(party);
		} catch (err) {
			return res.status(500).json({ message: 'Error creating party' });
		}
	}

	if (req.method === 'DELETE') {
		// Leave Party
		try {
			const party = await prisma.party.findFirst({
				where: { members: { has: userId } },
			});

			if (!party)
				return res.status(404).json({ message: 'Not in a party' });

			const newMembers = party.members.filter((m) => m !== userId);

			// Remove partyId from user
			await prisma.user.update({
				where: { id: userId },
				data: { partyId: null },
			});

			if (newMembers.length === 0) {
				// Delete active race if exists
				await prisma.race.deleteMany({
					where: { partyId: party.id },
				});
				// Delete party
				await prisma.party.delete({ where: { id: party.id } });
				return res.status(200).json({ message: 'Party dissolved' });
			} else {
				// Update party
				let newHostId = party.hostId;
				if (party.hostId === userId) {
					// Assign new host (first member)
					newHostId = newMembers[0];
				}

				await prisma.party.update({
					where: { id: party.id },
					data: {
						members: newMembers,
						hostId: newHostId,
					},
				});
				return res.status(200).json({ message: 'Left party' });
			}
		} catch (err) {
			return res.status(500).json({ message: 'Error leaving party' });
		}
	}

	if (req.method === 'GET') {
		// Get current party status
		try {
			const party = await prisma.party.findFirst({
				where: { members: { has: userId } }, // requires filtering by members since we don't have partyId in token
			});

			if (!party) return res.status(200).json(null); // No party

			// Get member details
			const members = await prisma.user.findMany({
				where: { id: { in: party.members } },
				select: { id: true, username: true, level: true },
			});

			// Get active race
			const activeRace = await prisma.race.findFirst({
				where: {
					partyId: party.id,
					status: { not: 'FINISHED' },
				},
				orderBy: { startTime: 'desc' },
			});

			return res.status(200).json({
				...party,
				members,
				activeRaceId: activeRace?.id,
			});
		} catch (err) {
			return res.status(500).json({ message: 'Error fetching party' });
		}
	}

	return res.status(405).json({ message: 'Method not allowed' });
}
