import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { LevelBadge } from '../shared/LevelBadge';
import { getFullUrl } from '../../../utils/prisma';

interface Friend {
	id: string;
	username: string;
	level: number;
	isOnline?: boolean;
}

export const FriendsSidepanel: React.FC<{
	isOpen: boolean;
	onClose: () => void;
}> = ({ isOpen, onClose }) => {
	const { user, token, isOnline, refreshUser, logout } = useAuth();
	const { showToast } = useToast();
	const [friends, setFriends] = useState<Friend[]>([]);
	const [showAddModal, setShowAddModal] = useState(false);
	const [showCodeModal, setShowCodeModal] = useState(false);
	const [friendCodeInput, setFriendCodeInput] = useState('');
	const [myFriendCode, setMyFriendCode] = useState('');
	const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
	const [menuPosition, setMenuPosition] = useState<{
		x: number;
		y: number;
	} | null>(null);
	// Challenges removed

	// Poll friends list and user data (for invites) when open
	useEffect(() => {
		if (!isOpen || !isOnline || !user) return;

		const pollData = async () => {
			if (token === 'mock-token') {
				setFriends([
					{
						id: 'f1',
						username: 'Rival_One',
						level: 15,
						isOnline: true,
					},
					{
						id: 'f2',
						username: 'Cruiser',
						level: 3,
						isOnline: false,
					},
				]);
				setMyFriendCode('DEV-CODE-123');
				return;
			}

			try {
				const res = await fetch(getFullUrl('/api/friends'), {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.ok) {
					const data = (await res.json()) as Friend[];
					setFriends(data);
				}
			} catch (e) {
				console.error('Failed to fetch friends');
			}

			if (refreshUser) refreshUser();

			try {
				const res = await fetch(
					getFullUrl('/api/users/:id').replace(':id', user.id),
					{
						headers: { Authorization: `Bearer ${token}` },
					}
				);
				if (res.ok) {
					const data = (await res.json()) as any;
					setMyFriendCode(data.friendCode);
				}
			} catch (e) {}
		};

		pollData();
		const interval = setInterval(pollData, 5000);
		return () => clearInterval(interval);
	}, [isOpen, isOnline, user?.id, token]);

	const handleAddFriend = async () => {
		if (!friendCodeInput) return;
		try {
			const res = await fetch(getFullUrl('/api/friends'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ friendCode: friendCodeInput }),
			});
			const data = (await res.json()) as any;
			if (res.ok) {
				showToast('Friend request sent!', 'SUCCESS');
				setShowAddModal(false);
				setFriendCodeInput('');
			} else {
				showToast(data.message || 'Failed to add friend', 'ERROR');
			}
		} catch (e) {
			showToast('Network error', 'ERROR');
		}
	};

	const handleFriendRequest = async (
		requesterId: string,
		accept: boolean
	) => {
		try {
			const res = await fetch(getFullUrl('/api/friends'), {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ requesterId, accept }),
			});

			if (res.ok) {
				showToast(
					accept ? 'Friend Request Accepted' : 'Request Declined',
					'SUCCESS'
				);
				if (refreshUser) refreshUser();
			} else {
				showToast('Failed to process request', 'ERROR');
			}
		} catch (e) {
			showToast('Network error', 'ERROR');
		}
	};

	const handleAction = async (action: 'INVITE' | 'REMOVE') => {
		if (!selectedFriend) return;

		if (action === 'REMOVE') {
			try {
				const res = await fetch(getFullUrl('/api/friends'), {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ friendId: selectedFriend.id }),
				});

				if (res.ok) {
					showToast(`Removed ${selectedFriend.username}`, 'INFO');
					setFriends((p) =>
						p.filter((f) => f.id !== selectedFriend.id)
					);
				} else {
					showToast('Failed to remove', 'ERROR');
				}
			} catch (e) {
				showToast('Network Error', 'ERROR');
			}
		} else if (action === 'INVITE') {
			try {
				const res = await fetch(getFullUrl('/api/party/invite'), {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						targetUserId: selectedFriend.id,
					}),
				});
				const data = (await res.json()) as any;
				if (res.ok) {
					showToast('Invite sent', 'SUCCESS');
					onClose();
				} else {
					showToast(data.message || 'Failed to invite', 'ERROR');
				}
			} catch (e) {
				showToast('Network Error', 'ERROR');
			}
		} else {
			showToast(
				`${action} sent to ${selectedFriend.username}`,
				'SUCCESS'
			);
		}
		setSelectedFriend(null);
	};

	const handleJoinParty = async (partyId: string) => {
		try {
			const res = await fetch(getFullUrl('/api/party/join'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ partyId }),
			});
			if (res.ok) {
				showToast('Joined Party!', 'SUCCESS');
				// Refresh user to get new partyId
				window.location.reload();
			} else {
				const data = (await res.json()) as any;
				showToast(data.message, 'ERROR');
			}
		} catch (e) {
			showToast('Error joining', 'ERROR');
		}
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-[-1]" onClick={onClose} />

			{/* Panel */}
			<div className="fixed top-16 bottom-0 right-0 w-80 bg-gray-900 border-l-4 border-gray-800 shadow-2xl z-50 flex flex-col font-pixel">
				{/* Header */}
				<div className="p-4 bg-gray-800 border-b-2 border-gray-700 flex justify-between items-center">
					<h2 className="text-white text-lg">FRIENDS</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white"
					>
						[X]
					</button>
				</div>

				{/* List */}
				<div className="flex-1 overflow-y-auto p-4 space-y-2">
					{/* Friend Requests Section */}
					{user?.friendRequestsReceived &&
						user.friendRequestsReceived.length > 0 && (
							<div className="mb-4 bg-yellow-900/30 p-2 border border-yellow-500 rounded">
								<div className="text-yellow-300 text-xs mb-2">
									FRIEND REQUESTS
								</div>
								{user.friendRequestsReceived.map((reqId) => (
									<div
										key={reqId}
										className="flex justify-between items-center bg-black/50 p-2 mb-1"
									>
										<span className="text-white text-xs">
											User #{reqId.slice(-4)}
										</span>
										<div className="flex gap-1">
											<button
												onClick={() =>
													handleFriendRequest(
														reqId,
														true
													)
												}
												className="text-green-400 hover:text-white text-[10px] border border-green-500 px-1"
											>
												YES
											</button>
											<button
												onClick={() =>
													handleFriendRequest(
														reqId,
														false
													)
												}
												className="text-red-400 hover:text-white text-[10px] border border-red-500 px-1"
											>
												NO
											</button>
										</div>
									</div>
								))}
							</div>
						)}

					{/* Invites Section */}
					{user?.partyInvites && user.partyInvites.length > 0 && (
						<div className="mb-4 bg-blue-900/30 p-2 border border-blue-500 rounded">
							<div className="text-blue-300 text-xs mb-2">
								PARTY INVITES
							</div>
							{user.partyInvites.map((pid) => (
								<div
									key={pid}
									className="flex justify-between items-center bg-black/50 p-2 mb-1"
								>
									<span className="text-white text-xs">
										Party #{pid.slice(-4)}
									</span>
									<button
										onClick={() => handleJoinParty(pid)}
										className="text-green-400 hover:text-white text-xs border border-green-500 px-2 py-1"
									>
										JOIN
									</button>
								</div>
							))}
						</div>
					)}

					{!isOnline ? (
						<div className="text-red-400 text-center mt-10">
							OFFLINE
						</div>
					) : friends.length === 0 ? (
						<div className="text-gray-500 text-center mt-10">
							No friends added.
						</div>
					) : (
						friends.map((friend) => (
							<div
								key={friend.id}
								onClick={(e) => {
									const rect =
										e.currentTarget.getBoundingClientRect();
									setSelectedFriend(friend);
									setMenuPosition({
										x: e.clientX,
										y: e.clientY,
									});
								}}
								className="bg-gray-800 p-3 border-2 border-transparent hover:border-cyan-500 cursor-pointer flex justify-between items-center group relative"
							>
								<div className="flex items-center gap-2">
									<LevelBadge
										level={friend.level}
										scale={0.7}
									/>
									<span className="text-white">
										{friend.username}
									</span>
								</div>
								<div
									className={`w-2 h-2 rounded-full ${
										friend.isOnline
											? 'bg-green-500'
											: 'bg-gray-500'
									}`}
								/>
							</div>
						))
					)}
				</div>

				{/* Bottom Buttons */}
				<div className="p-4 bg-gray-800 border-t-2 border-gray-700 flex flex-col gap-2">
					<div className="flex gap-2">
						<button
							onClick={() => setShowAddModal(true)}
							className="flex-1 bg-green-700 hover:bg-green-600 text-white text-xs py-2 px-1 border-b-4 border-green-900 active:border-b-0 active:mt-1"
						>
							ADD FRIEND
						</button>
						<button
							onClick={() => setShowCodeModal(true)}
							className="flex-1 bg-blue-700 hover:bg-blue-600 text-white text-xs py-2 px-1 border-b-4 border-blue-900 active:border-b-0 active:mt-1"
						>
							MY CODE
						</button>
					</div>
					<button
						onClick={() => {
							logout();
							window.location.reload();
						}}
						className="w-full bg-red-900 hover:bg-red-800 text-gray-300 hover:text-white text-xs py-2 border border-red-700"
					>
						LOG OUT
					</button>
				</div>

				{/* Add Friend Modal */}
				{showAddModal && (
					<div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
						<div className="bg-gray-800 border-2 border-white p-4 w-full max-w-xs">
							<h3 className="text-white mb-4">ENTER CODE:</h3>
							<input
								type="text"
								value={friendCodeInput}
								onChange={(e) =>
									setFriendCodeInput(
										(e.target as HTMLInputElement).value
									)
								}
								className="w-full bg-black border border-gray-600 text-white p-2 mb-4 font-mono uppercase"
								placeholder="XXXX-XXXX"
							/>
							<div className="flex justify-end gap-2">
								<button
									onClick={() => setShowAddModal(false)}
									className="text-gray-400 hover:text-white px-3 py-1"
								>
									CANCEL
								</button>
								<button
									onClick={handleAddFriend}
									className="bg-green-600 text-white px-3 py-1 hover:bg-green-500"
								>
									SEND
								</button>
							</div>
						</div>
					</div>
				)}

				{/* View Code Modal */}
				{showCodeModal && (
					<div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-[60]">
						<div className="bg-gray-800 border-2 border-white p-4 w-full max-w-xs text-center">
							<h3 className="text-white mb-2">
								YOUR FRIEND CODE:
							</h3>
							<div className="bg-black border border-gray-600 text-cyan-400 p-2 mb-4 font-mono text-lg select-all">
								{myFriendCode || 'LOADING...'}
							</div>
							<button
								onClick={() => {
									(navigator as any).clipboard.writeText(
										myFriendCode
									);
									showToast('Copied!', 'SUCCESS');
									setShowCodeModal(false);
								}}
								className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-500 w-full mb-2"
							>
								COPY
							</button>
							<button
								onClick={() => setShowCodeModal(false)}
								className="text-gray-400 hover:text-white text-sm underline"
							>
								CLOSE
							</button>
						</div>
					</div>
				)}

				{/* Friend Interaction Floating Menu */}
				{selectedFriend && menuPosition && (
					<div
						className="fixed z-[100] w-48 bg-gray-900 border-2 border-cyan-500 shadow-2xl p-2 font-pixel animate-fade-in"
						style={{
							top: Math.min(
								menuPosition.y,
								window.innerHeight - 200
							),
							left: Math.min(
								menuPosition.x,
								window.innerWidth - 200
							),
						}}
					>
						<div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-1">
							<span className="text-white text-sm">
								{selectedFriend.username}
							</span>
							<button
								onClick={() => setSelectedFriend(null)}
								className="text-red-500 hover:text-red-400"
							>
								[x]
							</button>
						</div>
						<div className="space-y-1">
							<button
								onClick={() => handleAction('INVITE')}
								className="w-full text-left px-2 py-1 bg-blue-900/50 hover:bg-blue-800 text-blue-200 text-xs"
							>
								INVITE TO PARTY
							</button>

							<button
								onClick={() => handleAction('REMOVE')}
								className="w-full text-left px-2 py-1 bg-red-900/50 hover:bg-red-800 text-red-300 text-xs border-t border-gray-800 mt-2"
							>
								REMOVE FRIEND
							</button>
						</div>
					</div>
				)}

				{/* Click away listener for menu */}
				{selectedFriend && (
					<div
						className="fixed inset-0 z-[90]"
						onClick={() => setSelectedFriend(null)}
					/>
				)}
			</div>
		</>
	);
};
