/**
 * Example file demonstrating how to use Prisma Client in your project
 *
 * This file shows common CRUD operations with the User model.
 * You can adapt these patterns for your own use cases.
 */

import { prisma } from './prisma';

// ============================================
// CREATE - Creating new users
// ============================================

export async function createUser(
	username: string,
	email: string,
	password: string
) {
	try {
		const user = await prisma.user.create({
			data: {
				id: crypto.randomUUID(), // MongoDB requires manual ID generation
				username,
				email,
				password,
				money: 0,
			},
		});
		return user;
	} catch (error) {
		console.error('Error creating user:', error);
		throw error;
	}
}

// ============================================
// READ - Finding and querying users
// ============================================

export async function getUserById(id: string) {
	try {
		const user = await prisma.user.findUnique({
			where: { id },
		});
		return user;
	} catch (error) {
		console.error('Error finding user:', error);
		throw error;
	}
}

export async function getUserByEmail(email: string) {
	try {
		const user = await prisma.user.findUnique({
			where: { email },
		});
		return user;
	} catch (error) {
		console.error('Error finding user by email:', error);
		throw error;
	}
}

export async function getAllUsers() {
	try {
		const users = await prisma.user.findMany();
		return users;
	} catch (error) {
		console.error('Error fetching users:', error);
		throw error;
	}
}

// ============================================
// UPDATE - Updating user data
// ============================================

export async function updateUserMoney(id: string, amount: number) {
	try {
		const user = await prisma.user.update({
			where: { id },
			data: {
				money: amount,
			},
		});
		return user;
	} catch (error) {
		console.error('Error updating user money:', error);
		throw error;
	}
}

export async function incrementUserMoney(id: string, increment: number) {
	try {
		const user = await prisma.user.update({
			where: { id },
			data: {
				money: {
					increment,
				},
			},
		});
		return user;
	} catch (error) {
		console.error('Error incrementing user money:', error);
		throw error;
	}
}

// ============================================
// DELETE - Removing users
// ============================================

export async function deleteUser(id: string) {
	try {
		const user = await prisma.user.delete({
			where: { id },
		});
		return user;
	} catch (error) {
		console.error('Error deleting user:', error);
		throw error;
	}
}

// ============================================
// ADVANCED - Complex queries
// ============================================

export async function getRichUsers(minMoney: number) {
	try {
		const users = await prisma.user.findMany({
			where: {
				money: {
					gte: minMoney,
				},
			},
			orderBy: {
				money: 'desc',
			},
		});
		return users;
	} catch (error) {
		console.error('Error finding rich users:', error);
		throw error;
	}
}

// ============================================
// CLEANUP - Disconnect when app closes
// ============================================

export async function disconnectPrisma() {
	await prisma.$disconnect();
}
