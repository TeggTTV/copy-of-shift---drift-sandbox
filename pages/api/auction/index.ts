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
	let userId: string | null = null;
	if (authHeader && authHeader.startsWith('Bearer ')) {
		try {
			const token = authHeader.split(' ')[1];
			const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
			userId = decoded.userId;
		} catch (e) {}
	}

	if (req.method === 'GET') {
		try {
			const listings = await prisma.auctionListing.findMany({
				where: {
					OR: [
						{ status: 'ACTIVE' },
						{ status: 'SOLD', sellerId: userId || undefined }, // Show SOLD only to seller
					],
				},
				orderBy: { createdAt: 'desc' },
			});
			return res.status(200).json(listings);
		} catch (e) {
			return res.status(500).json({ message: 'Error fetching listings' });
		}
	}

	if (req.method === 'POST') {
		if (!userId) return res.status(401).json({ message: 'Unauthorized' });

		const { action } = req.query;

		if (action === 'create') {
			const { item, price } = req.body;
			if (!item || !price)
				return res.status(400).json({ message: 'Missing data' });

			try {
				// Verify user owns item (optional but good practice)
				// For now, trust client but in real app we'd check DB inventory

				const listing = await prisma.auctionListing.create({
					data: {
						sellerId: userId,
						item,
						price,
						status: 'ACTIVE',
					},
				});

				// Track Stat
				const { incrementStat } = require('../../../utils/stats');
				incrementStat('auction_items_listed');

				return res.status(201).json(listing);
			} catch (e) {
				return res
					.status(500)
					.json({ message: 'Error creating listing' });
			}
		}

		if (action === 'buy') {
			const { listingId } = req.body;
			try {
				const listing = await prisma.auctionListing.findUnique({
					where: { id: listingId },
				});

				if (!listing || listing.status !== 'ACTIVE') {
					return res
						.status(400)
						.json({ message: 'Listing unavailable' });
				}

				if (listing.sellerId === userId) {
					return res
						.status(400)
						.json({ message: 'Cannot buy own listing' });
				}

				// Transaction:
				// 1. Deduct money from buyer
				// 2. Add money to seller (or hold in escrow/mailbox)
				// 3. Transfer item to buyer
				// 4. Mark listing as SOLD

				// Check buyer funds
				const buyer = await prisma.user.findUnique({
					where: { id: userId },
				});
				if (!buyer || buyer.money < listing.price) {
					return res
						.status(400)
						.json({ message: 'Insufficient funds' });
				}

				// Execute Transaction (Sequential for Standalone Mongo)
				await prisma.user.update({
					where: { id: userId },
					data: {
						money: { decrement: listing.price },
						inventory: { push: listing.item }, // Add item
					},
				});

				// DO NOT Add to seller immediately. They must claim it.
				// Update Listing
				await prisma.auctionListing.update({
					where: { id: listingId },
					data: { status: 'SOLD' },
				});

				// Track Stat
				const { incrementStat } = require('../../../utils/stats');
				incrementStat('auction_volume_traded', listing.price);

				return res.status(200).json({ message: 'Purchase successful' });
			} catch (e) {
				return res.status(500).json({ message: 'Transaction failed' });
			}
		}

		if (action === 'claim') {
			const { listingId } = req.body;
			try {
				const listing = await prisma.auctionListing.findUnique({
					where: { id: listingId },
				});

				if (!listing)
					return res
						.status(404)
						.json({ message: 'Listing not found' });
				if (listing.sellerId !== userId)
					return res.status(403).json({ message: 'Forbidden' });
				if (listing.status !== 'SOLD')
					return res.status(400).json({
						message: 'Listing not sold or already claimed',
					});

				// Transaction:
				// 1. Add money to seller
				// 2. Delete listing
				// Transaction:
				// 1. Add money to seller
				await prisma.user.update({
					where: { id: userId },
					data: {
						money: { increment: listing.price },
					},
				});

				// 2. Delete listing
				await prisma.auctionListing.delete({
					where: { id: listingId },
				});

				return res.status(200).json({ message: 'Funds claimed' });
			} catch (e) {
				return res
					.status(500)
					.json({ message: 'Error claiming funds' });
			}
		}
	}

	if (req.method === 'DELETE') {
		if (!userId) return res.status(401).json({ message: 'Unauthorized' });
		const { listingId } = req.body;

		try {
			const listing = await prisma.auctionListing.findUnique({
				where: { id: listingId },
			});

			if (!listing)
				return res.status(404).json({ message: 'Listing not found' });
			if (listing.sellerId !== userId)
				return res.status(403).json({ message: 'Forbidden' });

			// Return item to seller inventory
			await prisma.user.update({
				where: { id: userId },
				data: {
					inventory: { push: listing.item },
				},
			});

			await prisma.auctionListing.delete({
				where: { id: listingId },
			});

			return res.status(200).json({ message: 'Listing cancelled' });
		} catch (e) {
			return res.status(500).json({ message: 'Error cancelling' });
		}
	}

	return res.status(405).json({ message: 'Method not allowed' });
}
