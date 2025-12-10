/**
 * React hooks for Prisma database operations via API
 *
 * These hooks make it easier to use the API in React components
 * with proper loading states and error handling.
 */

import { useState, useEffect } from 'react';

import { getFullUrl } from '../utils/prisma';

const API_BASE = '/api';

type User = {
	id: string;
	username: string;
	email: string;
	password?: string; // Password might not be returned by API
	money: number;
};

/**
 * Hook to fetch a single user by ID
 */
export function useUser(userId: string | null) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!userId) {
			setLoading(false);
			return;
		}

		async function fetchUser() {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(
					getFullUrl('/api/users/:id').replace(':id', userId!)
				);
				if (!response.ok) {
					if (response.status === 404) {
						setUser(null);
						return;
					}
					throw new Error(`Error: ${response.statusText}`);
				}
				const userData = await response.json();
				setUser(userData as User);
			} catch (err) {
				setError(err as Error);
				console.error('Error fetching user:', err);
			} finally {
				setLoading(false);
			}
		}

		fetchUser();
	}, [userId]);

	return { user, loading, error };
}

/**
 * Hook to fetch all users
 */
export function useUsers() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		async function fetchUsers() {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(getFullUrl('/api/users'));
				if (!response.ok)
					throw new Error(`Error: ${response.statusText}`);
				const usersData: User[] = (await response.json()) as User[];
				// Sort by money desc
				usersData.sort((a, b) => b.money - a.money);
				setUsers(usersData);
			} catch (err) {
				setError(err as Error);
				console.error('Error fetching users:', err);
			} finally {
				setLoading(false);
			}
		}

		fetchUsers();
	}, []);

	return { users, loading, error };
}

/**
 * Hook to fetch users with money above a threshold
 */
export function useRichUsers(minMoney: number = 1000) {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		async function fetchRichUsers() {
			try {
				setLoading(true);
				setError(null);
				const response = await fetch(getFullUrl('/api/users'));
				if (!response.ok)
					throw new Error(`Error: ${response.statusText}`);
				const allUsers: User[] = (await response.json()) as User[];

				const richUsers = allUsers
					.filter((u) => u.money >= minMoney)
					.sort((a, b) => b.money - a.money);

				setUsers(richUsers);
			} catch (err) {
				setError(err as Error);
				console.error('Error fetching rich users:', err);
			} finally {
				setLoading(false);
			}
		}

		fetchRichUsers();
	}, [minMoney]);

	return { users, loading, error };
}

/**
 * Hook for user mutations (create, update, delete)
 */
export function useUserMutations() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const createUser = async (
		data: Omit<User, 'id' | 'money'> & { money?: number; password?: string }
	) => {
		try {
			setLoading(true);
			setError(null);
			const response = await fetch(getFullUrl('/api/users'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data),
			});
			if (!response.ok) throw new Error(`Error: ${response.statusText}`);
			const user = await response.json();
			return user;
		} catch (err) {
			setError(err as Error);
			console.error('Error creating user:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const updateUserMoney = async (userId: string, amount: number) => {
		try {
			setLoading(true);
			setError(null);
			const response = await fetch(
				getFullUrl('/api/users/:id/money').replace(':id', userId),
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ amount }),
				}
			);
			if (!response.ok) throw new Error(`Error: ${response.statusText}`);
			const user = await response.json();
			return user;
		} catch (err) {
			setError(err as Error);
			console.error('Error updating user money:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const incrementUserMoney = async (userId: string, increment: number) => {
		try {
			setLoading(true);
			setError(null);
			const response = await fetch(
				getFullUrl('/api/users/:id/money').replace(':id', userId),
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ increment }),
				}
			);
			if (!response.ok) throw new Error(`Error: ${response.statusText}`);
			const user = await response.json();
			return user;
		} catch (err) {
			setError(err as Error);
			console.error('Error incrementing user money:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const deleteUser = async (userId: string) => {
		try {
			setLoading(true);
			setError(null);
			const response = await fetch(
				getFullUrl('/api/users/:id').replace(':id', userId),
				{
					method: 'DELETE',
				}
			);
			if (!response.ok) throw new Error(`Error: ${response.statusText}`);
			return true;
		} catch (err) {
			setError(err as Error);
			console.error('Error deleting user:', err);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return {
		createUser,
		updateUserMoney,
		incrementUserMoney,
		deleteUser,
		loading,
		error,
	};
}
