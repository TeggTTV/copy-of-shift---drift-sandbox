/**
 * Simple test to verify Prisma Client integration
 *
 * Run this with: node --loader tsx scripts/testPrisma.ts
 * Or import and call testPrismaConnection() from your app
 */

import prisma from '../utils/prisma';

export async function testPrismaConnection() {
	try {
		console.log('🔍 Testing Prisma connection...');

		// Test basic connection by counting users
		const userCount = await prisma.user.count();
		console.log('✅ Connection successful!');
		console.log(`📊 Current user count: ${userCount}`);

		// Optional: List all users (be careful with large datasets)
		const users = await prisma.user.findMany({
			take: 5, // Limit to 5 users
			select: {
				id: true,
				username: true,
				email: true,
				money: true,
			},
		});

		if (users.length > 0) {
			console.log('\n👥 Sample users:');
			users.forEach((user) => {
				console.log(
					`  - ${user.username} (${user.email}) - $${user.money}`
				);
			});
		} else {
			console.log('\n📭 No users found in database');
		}

		return true;
	} catch (error) {
		console.error('❌ Prisma connection failed:', error);
		return false;
	} finally {
		await prisma.$disconnect();
	}
}

// Run test when file is executed directly
if (require.main === module) {
	testPrismaConnection()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
