/**
 * Example React component demonstrating Prisma integration
 *
 * This shows how to use the custom Prisma hooks in your components.
 * You can copy and modify this pattern for your actual use cases.
 */

import React, { useState } from 'react';
import { useUsers, useUser, useUserMutations } from '../../hooks/usePrisma';

export function UserDashboard() {
	const { users, loading: usersLoading, error: usersError } = useUsers();
	const {
		createUser,
		incrementUserMoney,
		deleteUser,
		loading: mutationLoading,
	} = useUserMutations();
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const { user: selectedUser, loading: userLoading } =
		useUser(selectedUserId);

	// Form state for creating new user
	const [newUsername, setNewUsername] = useState('');
	const [newEmail, setNewEmail] = useState('');
	const [newPassword, setNewPassword] = useState('');

	const handleCreateUser = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await createUser({
				username: newUsername,
				email: newEmail,
				password: newPassword,
			});
			// Reset form
			setNewUsername('');
			setNewEmail('');
			setNewPassword('');
			// Refresh users list (in a real app, you'd want to refetch or update state)
			window.location.reload();
		} catch (error) {
			alert('Failed to create user');
		}
	};

	const handleAddMoney = async (userId: string) => {
		try {
			await incrementUserMoney(userId, 100);
			window.location.reload(); // Refresh to show updated data
		} catch (error) {
			alert('Failed to add money');
		}
	};

	const handleDeleteUser = async (userId: string) => {
		if (confirm('Are you sure you want to delete this user?')) {
			try {
				await deleteUser(userId);
				window.location.reload();
			} catch (error) {
				alert('Failed to delete user');
			}
		}
	};

	if (usersLoading) {
		return <div className="p-4">Loading users...</div>;
	}

	if (usersError) {
		return (
			<div className="p-4 text-red-500">Error: {usersError.message}</div>
		);
	}

	return (
		<div className="p-6 max-w-6xl mx-auto">
			<h1 className="text-3xl font-bold mb-6">User Dashboard</h1>

			{/* Create User Form */}
			<div className="bg-white rounded-lg shadow-md p-6 mb-6">
				<h2 className="text-xl font-semibold mb-4">Create New User</h2>
				<form onSubmit={handleCreateUser} className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1">
							Username
						</label>
						<input
							type="text"
							value={newUsername}
							onChange={(e) => setNewUsername(e.target.value)}
							className="w-full px-3 py-2 border rounded-md"
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">
							Email
						</label>
						<input
							type="email"
							value={newEmail}
							onChange={(e) => setNewEmail(e.target.value)}
							className="w-full px-3 py-2 border rounded-md"
							required
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">
							Password
						</label>
						<input
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							className="w-full px-3 py-2 border rounded-md"
							required
						/>
					</div>
					<button
						type="submit"
						disabled={mutationLoading}
						className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
					>
						{mutationLoading ? 'Creating...' : 'Create User'}
					</button>
				</form>
			</div>

			{/* Users List */}
			<div className="bg-white rounded-lg shadow-md p-6">
				<h2 className="text-xl font-semibold mb-4">
					All Users ({users.length})
				</h2>
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-100">
							<tr>
								<th className="px-4 py-2 text-left">
									Username
								</th>
								<th className="px-4 py-2 text-left">Email</th>
								<th className="px-4 py-2 text-right">Money</th>
								<th className="px-4 py-2 text-center">
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{users.length === 0 ? (
								<tr>
									<td
										colSpan={4}
										className="px-4 py-8 text-center text-gray-500"
									>
										No users found. Create one above!
									</td>
								</tr>
							) : (
								users.map((user) => (
									<tr
										key={user.id}
										className={`border-t hover:bg-gray-50 ${
											selectedUserId === user.id
												? 'bg-blue-50'
												: ''
										}`}
									>
										<td className="px-4 py-3">
											{user.username}
										</td>
										<td className="px-4 py-3">
											{user.email}
										</td>
										<td className="px-4 py-3 text-right font-mono">
											${user.money.toFixed(2)}
										</td>
										<td className="px-4 py-3 text-center space-x-2">
											<button
												onClick={() =>
													setSelectedUserId(user.id)
												}
												className="text-blue-600 hover:underline text-sm"
											>
												View
											</button>
											<button
												onClick={() =>
													handleAddMoney(user.id)
												}
												disabled={mutationLoading}
												className="text-green-600 hover:underline text-sm disabled:text-gray-400"
											>
												+$100
											</button>
											<button
												onClick={() =>
													handleDeleteUser(user.id)
												}
												disabled={mutationLoading}
												className="text-red-600 hover:underline text-sm disabled:text-gray-400"
											>
												Delete
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Selected User Details */}
			{selectedUserId && (
				<div className="bg-white rounded-lg shadow-md p-6 mt-6">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">User Details</h2>
						<button
							onClick={() => setSelectedUserId(null)}
							className="text-gray-500 hover:text-gray-700"
						>
							Close
						</button>
					</div>
					{userLoading ? (
						<p>Loading user details...</p>
					) : selectedUser ? (
						<div className="space-y-2">
							<p>
								<strong>ID:</strong>{' '}
								<code className="bg-gray-100 px-2 py-1 rounded">
									{selectedUser.id}
								</code>
							</p>
							<p>
								<strong>Username:</strong>{' '}
								{selectedUser.username}
							</p>
							<p>
								<strong>Email:</strong> {selectedUser.email}
							</p>
							<p>
								<strong>Money:</strong> $
								{selectedUser.money.toFixed(2)}
							</p>
						</div>
					) : (
						<p className="text-red-500">User not found</p>
					)}
				</div>
			)}
		</div>
	);
}
