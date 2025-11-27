import React from 'react';
import { GamePhase, Mission } from '../../types';
import { useSound } from '../../contexts/SoundContext';

interface MissionSelectProps {
	missions: Mission[];
	money: number;
	onStartMission: (m: Mission) => void;
	setPhase: (p: GamePhase) => void;
}

const MissionSelect: React.FC<MissionSelectProps> = ({
	missions,
	money,
	onStartMission,
	setPhase,
}) => {
	const { play } = useSound();
	return (
		<div className="absolute inset-0 bg-neutral-900 flex flex-col items-center py-10 text-white z-50 overflow-y-auto">
			<div className="w-full max-w-4xl px-4">
				<div className="flex justify-between items-center mb-8">
					<button
						onClick={() => setPhase('MAP')}
						className="text-gray-400 hover:text-white"
					>
						&larr; BACK
					</button>
					<h2 className="text-3xl font-bold italic">
						SELECT MISSION
					</h2>
					<div className="font-mono text-green-400">${money}</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{missions.map((m) => (
						<div
							key={m.id}
							className="bg-black border border-gray-800 p-6 rounded-xl hover:border-indigo-500 transition-all group relative overflow-hidden cursor-pointer"
							onClick={() => onStartMission(m)}
						>
							<div className="relative z-10">
								<div className="flex justify-between items-start mb-2">
									<h3 className="text-2xl font-bold italic">
										{m.name}
									</h3>
									<span className="bg-green-900 text-green-300 px-2 py-1 text-xs font-mono rounded">
										${m.payout}
									</span>
								</div>
								<p className="text-gray-400 text-sm mb-4 h-10">
									{m.description}
								</p>

								<div className="flex justify-between items-end">
									<div className="flex flex-col gap-1">
										<div className="text-xs text-gray-500 uppercase">
											Opponent
										</div>
										<div className="font-bold flex items-center gap-2">
											<div
												className="w-3 h-3 rounded-full"
												style={{
													background:
														m.opponent.color,
												}}
											></div>
											{m.opponent.name}
										</div>
									</div>
									<div className="text-right">
										{m.bestTime ? (
											<div className="text-yellow-500 font-mono text-sm">
												Best: {m.bestTime.toFixed(3)}s
											</div>
										) : (
											<div className="text-gray-600 font-mono text-xs">
												NO RECORD
											</div>
										)}
										<div className="text-xs text-indigo-400">
											{m.distance}m
										</div>
									</div>
								</div>

								<button
									onClick={() => onStartMission(m)}
									className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 font-bold rounded uppercase tracking-widest shadow-lg shadow-indigo-900/20"
								>
									RACE
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default MissionSelect;
