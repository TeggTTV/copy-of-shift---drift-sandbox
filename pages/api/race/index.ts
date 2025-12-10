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

	const { action } = req.query; // 'create', 'sync', 'status'

	try {
		if (req.method === 'POST') {
			if (action === 'create') {
				// Start Race (Host only)
				const user = await prisma.user.findUnique({
					where: { id: userId },
				});
				if (!user?.partyId)
					return res.status(400).json({ message: 'Not in a party' });

				const party = await prisma.party.findUnique({
					where: { id: user.partyId },
				});
				if (party?.hostId !== userId)
					return res
						.status(403)
						.json({ message: 'Only host can start race' });

				// Initialize player states
				const playerStates = party.members.map((mid) => ({
					userId: mid,
					progress: 0,
					speed: 0,
					finished: false,
					time: 0,
					placement: 0,
				}));

				// Create Race
				const race = await prisma.race.create({
					data: {
						partyId: party.id,
						status: 'COUNTDOWN',
						startTime: new Date(Date.now() + 5000), // 5 sec countdown
						playerStates,
					},
				});

				return res.status(201).json(race);
			}

			if (action === 'sync') {
				// Update My State
				const { raceId, progress, speed, finished, time } = req.body;

				const race = await prisma.race.findUnique({
					where: { id: raceId },
				});
				if (!race)
					return res.status(404).json({ message: 'Race not found' });

				const states = race.playerStates as any[];
				const myIndex = states.findIndex(
					(s: any) => s.userId === userId
				);

				if (myIndex === -1)
					return res
						.status(403)
						.json({ message: 'Not in this race' });

				// update state
				states[myIndex] = {
					...states[myIndex],
					progress,
					speed,
					finished,
					time: finished ? time : 0,
				};

				// Check if I finished just now
				if (finished && !race.winnerId) {
					// I might be the winner?
					// Need to verify atomic lock or just trust first to write winnerId?
					// For prototype, simple check:
					const anyoneElseFinished = states.some(
						(s: any) => s.userId !== userId && s.finished
					);
					if (!anyoneElseFinished) {
						// I am first
						await prisma.race.update({
							where: { id: raceId },
							data: {
								winnerId: userId,
								playerStates: states as any,
							},
						});
						return res
							.status(200)
							.json({ message: 'Updated', winner: true });
					}
				}

				// Save
				await prisma.race.update({
					where: { id: raceId },
					data: { playerStates: states as any },
				});

				return res.status(200).json({ message: 'Updated' });
			}
		}

		if (req.method === 'GET') {
			const { partyId } = req.query;
			if (!partyId || Array.isArray(partyId))
				return res.status(400).json({ message: 'Party ID required' });

			const race = await prisma.race.findUnique({
				where: { partyId },
			});

			return res.status(200).json(race);
		}
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: 'Internal Server Error' });
	}

	return res.status(405).json({ message: 'Method not allowed' });
}
