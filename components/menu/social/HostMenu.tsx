import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useParty } from '../../../contexts/PartyContext';
import { LevelBadge } from '../shared/LevelBadge';

export const HostMenu: React.FC = () => {
	const { user } = useAuth();
	const { party, leaveParty, startRace } = useParty();
	const [isMinimized, setIsMinimized] = useState(false);

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
				{party.members?.map((member) => (
					<div
						key={member.id}
						className="flex gap-4 items-center text-xs bg-black/40 p-1"
					>
						<LevelBadge level={member.level} scale={0.75} />
						<span
							className={`text-white ${
								member.id === party.hostId
									? 'text-yellow-400'
									: ''
							}`}
						>
							{/* {member.id === party.hostId ? '★ ' : ''} */}
							{member.username}
						</span>
					</div>
				))}
			</div>

			{/* Actions */}
			<div className="p-2 border-t border-cyan-700 space-y-2">
				{isHost && (
					<button
						onClick={startRace}
						className="w-full bg-green-600 hover:bg-green-500 text-white py-1 text-sm border-b-2 border-green-800 active:border-b-0 active:mt-[2px]"
					>
						{party.activeRaceId ? 'RESTART RACE' : 'START RACE'}
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
