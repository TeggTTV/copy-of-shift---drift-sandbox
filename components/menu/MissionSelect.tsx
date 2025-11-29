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
		<div className="absolute inset-0 bg-neutral-900 flex flex-col items-center py-10 text-white z-50 overflow-y-auto font-pixel">
			<div className="w-full max-w-4xl px-4">
				<div className="flex justify-between items-center mb-8">
					<button
						onClick={() => setPhase('MAP')}
						className="text-gray-400 hover:text-white text-xs"
					>
						&lt; BACK
					</button>
					<h2 className="text-2xl text-white pixel-text">
						SELECT MISSION
					</h2>
					<div className="text-green-400 text-xl pixel-text">
						${money}
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{missions.map((m) => (
						<div
							key={m.id}
							className="pixel-panel p-6 hover:border-indigo-500 transition-all group relative overflow-hidden cursor-pointer bg-black"
							onClick={() => onStartMission(m)}
						>
							<div className="relative z-10">
								<div className="flex justify-between items-start mb-2">
									<h3 className="text-lg text-white pixel-text">
										{m.name}
									</h3>
									<span className="bg-green-900 text-green-300 px-2 py-1 text-[10px] rounded pixel-border">
										${m.payout}
									</span>
								</div>
								<p className="text-gray-400 text-xs mb-4 h-10 leading-relaxed">
									{m.description}
								</p>

								<div className="flex justify-between items-end">
									<div className="flex flex-col gap-1">
										<div className="text-[10px] text-gray-500 uppercase">
											Opponent
										</div>
										<div className="font-bold flex items-center gap-2 text-xs">
											<div
												className="w-3 h-3 pixel-border"
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
											<div className="text-yellow-500 text-xs">
												Best: {m.bestTime.toFixed(3)}s
											</div>
										) : (
											<div className="text-gray-600 text-[10px]">
												NO RECORD
											</div>
										)}
										<div className="text-[10px] text-indigo-400">
											{m.distance}m
										</div>
									</div>
								</div>

								<button
									onClick={() => onStartMission(m)}
									className="w-full mt-4 pixel-btn"
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
