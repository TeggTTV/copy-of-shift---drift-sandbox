import prisma from './prisma';

export async function incrementStat(key: string, amount: number = 1) {
	try {
		await prisma.globalStats.upsert({
			where: { key },
			update: {
				value: { increment: amount },
			},
			create: {
				key,
				value: amount,
			},
		});
	} catch (error) {
		console.error(`Failed to increment stat ${key}:`, error);
	}
}
