import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useParty } from '../../../contexts/PartyContext';
import { useToast } from '../../../contexts/ToastContext';
import { getFullUrl } from '../../../utils/prisma';
import { LevelBadge } from '../shared/LevelBadge';

export const HostMenu: React.FC = () => {
	const { user, token } = useAuth();
	const { party, leaveParty, startRace } = useParty();
	const [isMinimized, setIsMinimized] = useState(false);
	const { showToast } = useToast();

	if (!party) return null;

	if (isMinimized) {
		return (
			<div
				className="fixed bottom-4 left-4 bg-gray-900 border-2 border-cyan-500 p-2 cursor-pointer z-50 font-pixel text-xs text-cyan-400 hover:text-white"
				onClick={() => setIsMinimized(false)}
			>
				PARTY ({party.members?.length}) ⬆
			</div>
		);
	}

	const isHost = party.hostId === user?.id;
	const isReady = party.readyMemberIds?.includes(user?.id || '');
	const allReady = party.members
		.filter((m) => m.id !== party.hostId)
		.every((m) => party.readyMemberIds?.includes(m.id));

	const handleReady = async () => {
		try {
			const res = await fetch(getFullUrl('/api/party/ready'), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				const data = await res.json();
				showToast(data.message, 'SUCCESS');
			} else {
				showToast('Failed to toggle ready', 'ERROR');
			}
		} catch (e) {
			showToast('Network error', 'ERROR');
		}
	};

	return (
		<div className="fixed bottom-4 left-4 w-64 bg-gray-900 border-2 border-cyan-600 shadow-2xl z-50 font-pixel">
			{/* Header */}
			<div className="bg-cyan-900/50 p-2 flex justify-between items-center border-b border-cyan-700">
				<span className="text-cyan-300 text-sm">PARTY LOBBY</span>
				<button
					onClick={() => setIsMinimized(true)}
					className="text-cyan-400 hover:text-white"
				>
					_
				</button>
			</div>

			{/* Race Indicator */}
			{party.activeRaceId && (
				<div className="bg-yellow-900/80 text-yellow-500 text-center text-xs py-1 animate-pulse border-b border-yellow-700">
					RACE IN PROGRESS
				</div>
			)}

			{/* Members */}
			<div className="p-2 space-y-1 max-h-40 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
				{party.members?.map((member) => {
					const memberIsReady = party.readyMemberIds?.includes(
						member.id
					);
					return (
						<div
							key={member.id}
							className="flex justify-between items-center text-xs bg-black/40 p-1"
						>
							<div className="flex gap-2 items-center">
								<LevelBadge level={member.level} scale={0.75} />
								<span
									className={`text-white ${
										member.id === party.hostId
											? 'text-yellow-400'
											: ''
									}`}
								>
									{member.username}
								</span>
							</div>
							{member.id !== party.hostId && (
								<span
									className={
										memberIsReady
											? 'text-green-500'
											: 'text-gray-600'
									}
								>
									{memberIsReady ? 'READY' : 'WAITING'}
								</span>
							)}
						</div>
					);
				})}
			</div>

			{/* Actions */}
			<div className="p-2 border-t border-cyan-700 space-y-2">
				{isHost ? (
					<button
						onClick={startRace}
						disabled={!allReady && !party.activeRaceId}
						className={`w-full py-1 text-sm border-b-2 active:border-b-0 active:mt-[2px] ${
							allReady || party.activeRaceId
								? 'bg-green-600 hover:bg-green-500 text-white border-green-800'
								: 'bg-gray-700 text-gray-400 border-gray-800 cursor-not-allowed'
						}`}
					>
						{party.activeRaceId
							? 'RESTART RACE'
							: allReady
							? 'START RACE'
							: 'WAITING FOR READY'}
					</button>
				) : (
					<button
						className={`w-full py-1 text-sm border-b-2 active:border-b-0 active:mt-[2px] ${
							isReady
								? 'bg-green-600 hover:bg-green-500 text-white border-green-800'
								: 'bg-blue-600 hover:bg-blue-500 text-white border-blue-800'
						}`}
						onClick={handleReady}
					>
						{isReady ? 'READY!' : 'CLICK TO READY'}
					</button>
				)}
				<button
					onClick={leaveParty}
					className="w-full bg-red-900 hover:bg-red-800 text-gray-400 hover:text-white py-1 text-xs"
				>
					LEAVE PARTY
				</button>
			</div>
		</div>
	);
};
