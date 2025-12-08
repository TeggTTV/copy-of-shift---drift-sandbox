import React from 'react';
import { Rival, Mission } from '@/types';
import { RIVALS } from '@/constants';

interface RivalsTabProps {
	defeatedRivals: string[];
	level: number;
	onChallenge: (rival: Rival) => void;
}

const RivalsTab: React.FC<RivalsTabProps> = ({
	defeatedRivals,
	level,
	onChallenge,
}) => {
	const getRivalStatus = (rival: Rival) => {
		if (defeatedRivals.includes(rival.id)) return 'DEFEATED';

		// Check unlock requirements
		if (
			rival.unlockRequirements.level &&
			level < rival.unlockRequirements.level
		) {
			return 'LOCKED';
		}
		if (
			rival.unlockRequirements.previousRivalId &&
			!defeatedRivals.includes(rival.unlockRequirements.previousRivalId)
		) {
			return 'LOCKED';
		}

		return 'AVAILABLE';
	};

	return (
		<div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
			<h2 className="text-3xl font-black italic text-white mb-4 pixel-text">
				STREET RIVALS
			</h2>
			<div className="grid grid-cols-1 gap-4">
				{RIVALS.map((rival) => {
					const status = getRivalStatus(rival);
					return (
						<div
							key={rival.id}
							className={`relative p-6 border-4 ${
								status === 'DEFEATED'
									? 'bg-gray-900/50 border-green-600 opacity-75'
									: status === 'AVAILABLE'
									? 'bg-gray-800 border-yellow-400'
									: 'bg-gray-900 border-gray-700 opacity-50'
							}`}
						>
							<div className="flex justify-between items-start">
								<div>
									<div className="flex items-center gap-3 mb-2">
										<span className="text-2xl font-bold text-white">
											#{rival.rank} {rival.name}
										</span>
										{status === 'DEFEATED' && (
											<span className="bg-green-600 text-black px-2 py-1 text-xs font-bold">
												DEFEATED
											</span>
										)}
										{status === 'LOCKED' && (
											<span className="bg-gray-600 text-white px-2 py-1 text-xs font-bold">
												LOCKED
											</span>
										)}
									</div>
									<p className="text-gray-400 italic mb-4">
										"{rival.bio}"
									</p>

									<div className="flex gap-4 text-sm font-mono text-gray-300">
										<div>
											REWARD:{' '}
											<span className="text-green-400">
												$
												{rival.rewards.money.toLocaleString()}
											</span>
										</div>
										{rival.rewards.car && (
											<div>
												CAR:{' '}
												<span className="text-yellow-400">
													Unique Ride
												</span>
											</div>
										)}
									</div>
								</div>

								{status === 'AVAILABLE' && (
									<button
										onClick={() => onChallenge(rival)}
										className="px-6 py-3 bg-yellow-400 text-black font-black text-xl hover:bg-yellow-300 hover:scale-105 transition-all uppercase skew-x-[-10deg]"
									>
										CHALLENGE
									</button>
								)}

								{status === 'LOCKED' && (
									<div className="text-red-400 font-mono text-sm text-right">
										REQUIRES:
										{rival.unlockRequirements.level && (
											<div>
												LEVEL{' '}
												{rival.unlockRequirements.level}
											</div>
										)}
										{rival.unlockRequirements
											.previousRivalId && (
											<div>DEFEAT PREVIOUS RIVAL</div>
										)}
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default RivalsTab;
