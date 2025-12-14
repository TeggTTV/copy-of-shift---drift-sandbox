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

	if (req.method === 'GET') {
		// Get pending challenges
		try {
			const challenges = await prisma.challenge.findMany({
				where: {
					targetId: userId,
					status: 'PENDING',
				},
			});

			// Enrich with challenger names
			const enriched = await Promise.all(
				challenges.map(async (c) => {
					const challenger = await prisma.user.findUnique({
						where: { id: c.challengerId },
						select: { username: true, level: true },
					});
					return {
						...c,
						challengerName: challenger?.username,
						challengerLevel: challenger?.level,
					};
				})
			);

			return res.status(200).json(enriched);
		} catch (e) {
			return res
				.status(500)
				.json({ message: 'Error fetching challenges' });
		}
	}

	if (req.method === 'POST') {
		// Respond to challenge
		const { challengeId, accept } = req.body;

		try {
			const challenge = await prisma.challenge.findUnique({
				where: { id: challengeId },
			});

			if (!challenge || challenge.targetId !== userId) {
				return res.status(404).json({ message: 'Challenge not found' });
			}

			if (!accept) {
				await prisma.challenge.update({
					where: { id: challengeId },
					data: { status: 'DECLINED' },
				});
				return res.status(200).json({ message: 'Declined' });
			}

			// ACCEPT Logic
			// 1. Check funds again
			const challenger = await prisma.user.findUnique({
				where: { id: challenge.challengerId },
			});
			const target = await prisma.user.findUnique({
				where: { id: userId },
			});

			if (!challenger || !target)
				return res.status(404).json({ message: 'User missing' });

			if (challenge.wager > 0) {
				if (
					challenger.money < challenge.wager ||
					target.money < challenge.wager
				) {
					return res
						.status(400)
						.json({ message: 'Insufficient funds for wager' });
				}
			}

			// 2. Create Temporary Party
			// We create a new party for this race.
			// If users are in other parties, they are pulled out (or we handle that).
			// For simplicity: Force move to new party.

			const party = await prisma.party.create({
				data: {
					hostId: challenge.challengerId,
					members: [challenge.challengerId, userId],
					isOpen: false, // Private race
				},
			});

			// 3. Update Users
			await prisma.user.update({
				where: { id: challenge.challengerId },
				data: { partyId: party.id },
			});
			await prisma.user.update({
				where: { id: userId },
				data: { partyId: party.id },
			});

			// 4. Deduct Wager (Escrow)
			if (challenge.wager > 0) {
				await prisma.user.update({
					where: { id: challenge.challengerId },
					data: { money: { decrement: challenge.wager } },
				});
				await prisma.user.update({
					where: { id: userId },
					data: { money: { decrement: challenge.wager } },
				});
			}

			// 5. Create Race
			const playerStates = [challenge.challengerId, userId].map(
				(mid) => ({
					userId: mid,
					progress: 0,
					speed: 0,
					finished: false,
					time: 0,
					placement: 0,
				})
			);

			await prisma.race.create({
				data: {
					partyId: party.id,
					status: 'COUNTDOWN',
					startTime: new Date(Date.now() + 5000),
					betAmount: challenge.wager,
					playerStates,
				},
			});

			// 6. Mark Challenge Accepted
			await prisma.challenge.update({
				where: { id: challengeId },
				data: { status: 'ACCEPTED' },
			});

			return res
				.status(200)
				.json({ message: 'Race Starting!', partyId: party.id });
		} catch (e) {
			console.error(e);
			return res
				.status(500)
				.json({ message: 'Error processing response' });
		}
	}

	return res.status(405).json({ message: 'Method not allowed' });
}
