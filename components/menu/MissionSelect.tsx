import React, { useState, useMemo } from 'react';
import { DailyChallenge, GamePhase, Mission, SavedTune } from '../../types';
import { useSound } from '../../contexts/SoundContext';
import { generateOpponent } from '../../utils/OpponentGenerator';
import { BASE_TUNING } from '../../constants';

interface MissionSelectProps {
	missions: Mission[];
	money: number;
	onStartMission: (m: Mission) => void;
	onBack: () => void;
	undergroundLevel?: number;
	garage?: SavedTune[];
	dailyChallenges?: DailyChallenge[];
}

const MissionSelect: React.FC<MissionSelectProps> = ({
	missions,
	money,
	onStartMission,
	onBack,
	undergroundLevel = 1,
	garage = [],
	dailyChallenges = [],
}) => {
	const { play } = useSound();
	const [activeTab, setActiveTab] = useState<
		'CAMPAIGN' | 'UNDERGROUND' | 'DAILY'
	>('CAMPAIGN');

	// Generate the current rival based on level
	// Memoize so it doesn't change on every render, only when level changes
	const currentRival = useMemo(() => {
		return generateOpponent(undergroundLevel);
	}, [undergroundLevel]);

	const handleStartUnderground = () => {
		const mission: Mission = {
			id: 999 + undergroundLevel, // Unique ID
			name: `Underground Rival: ${currentRival.name}`,
			description: `Defeat ${currentRival.name} to increase your Underground Rank.`,
			payout: 500 + undergroundLevel * 100, // Scaled payout
			difficulty: 'UNDERGROUND',
			distance: 402, // Standard 1/4 mile
			opponent: currentRival,
		};
		onStartMission(mission);
	};

	return (
		<div className="absolute inset-0 bg-neutral-900 flex flex-col items-center py-10 text-white z-50 overflow-y-auto font-pixel">
			<div className="w-full max-w-4xl px-4">
				<div className="flex justify-between items-center mb-8">
					<button
						onClick={onBack}
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

				{/* Tabs */}
				<div className="flex gap-4 mb-6 border-b border-gray-800 pb-4">
					<button
						onClick={() => setActiveTab('CAMPAIGN')}
						className={`text-lg pixel-text transition-colors ${
							activeTab === 'CAMPAIGN'
								? 'text-white'
								: 'text-gray-600 hover:text-gray-400'
						}`}
					>
						CAMPAIGN
					</button>
					<button
						onClick={() => setActiveTab('DAILY')}
						className={`text-lg pixel-text transition-colors ${
							activeTab === 'DAILY'
								? 'text-yellow-400'
								: 'text-gray-600 hover:text-gray-400'
						}`}
					>
						DAILY
					</button>
					<button
						onClick={() => setActiveTab('UNDERGROUND')}
						className={`text-lg pixel-text transition-colors ${
							activeTab === 'UNDERGROUND'
								? 'text-purple-400'
								: 'text-gray-600 hover:text-gray-400'
						}`}
					>
						UNDERGROUND
					</button>
				</div>

				{activeTab === 'DAILY' ? (
					<div className="flex flex-col gap-6 animate-in fade-in duration-500">
						<div className="text-center mb-4">
							<div className="text-yellow-500 text-xl pixel-text mb-1">
								DAILY CHALLENGES
							</div>
							<div className="text-gray-400 text-xs">
								Resets in:{' '}
								{dailyChallenges.length > 0
									? new Date(
											dailyChallenges[0].expiresAt -
												Date.now()
									  )
											.toISOString()
											.substr(11, 8)
									: '00:00:00'}
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{dailyChallenges.map((m) => (
								<div
									key={m.id}
									className={`pixel-panel p-4 transition-all group relative overflow-hidden cursor-pointer bg-black border-yellow-900 hover:border-yellow-500`}
									onClick={() => onStartMission(m)}
								>
									<div className="absolute top-0 right-0 bg-yellow-900/50 text-yellow-200 text-[10px] px-2 py-1">
										{m.difficulty}
									</div>
									<div className="flex flex-col h-full justify-between">
										<div>
											<h3 className="text-yellow-400 pixel-text mb-2">
												{m.name}
											</h3>
											<p className="text-gray-500 text-[10px] mb-4">
												{m.description}
											</p>
										</div>

										<div className="mt-auto">
											<div className="flex justify-between items-end mb-3">
												<div className="text-[10px] text-gray-400">
													REWARD
												</div>
												<div className="text-green-400 font-bold">
													${m.payout}
												</div>
											</div>
											<button className="w-full pixel-btn bg-yellow-900/20 border-yellow-800 text-yellow-500 hover:bg-yellow-900/40 text-xs py-2">
												ACCEPT
											</button>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				) : activeTab === 'CAMPAIGN' ? (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{missions.map((m) => {
							const isBoss = !!m.rewardCar;
							const isOwned =
								isBoss &&
								garage.some(
									(car) => car.id === m.rewardCar?.id
								);

							return (
								<div
									key={m.id}
									className={`pixel-panel p-6 transition-all group relative overflow-hidden cursor-pointer bg-black ${
										isBoss
											? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]'
											: 'hover:border-indigo-500'
									}`}
									onClick={() => onStartMission(m)}
								>
									{isBoss && (
										<div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1">
											BOSS BATTLE
										</div>
									)}
									<div className="relative z-10">
										<div className="flex justify-between items-start mb-2">
											<h3
												className={`text-lg pixel-text ${
													isBoss
														? 'text-yellow-400'
														: 'text-white'
												}`}
											>
												{m.name}
											</h3>
											<span className="bg-green-900 text-green-300 px-2 py-1 text-[10px] rounded pixel-border">
												${m.payout}
											</span>
										</div>
										<p className="text-gray-400 text-xs mb-4 h-10 leading-relaxed">
											{m.description}
										</p>

										{isBoss && m.rewardCar && (
											<div className="mb-4 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded flex items-center gap-3">
												<div className="text-2xl">
													🚘
												</div>
												<div>
													<div className="text-[10px] text-yellow-500 uppercase font-bold">
														Reward: Pink Slip
													</div>
													<div className="text-xs text-white">
														{m.rewardCar.name}
													</div>
													{isOwned && (
														<div className="text-[10px] text-green-400 font-bold mt-1">
															(ALREADY OWNED)
														</div>
													)}
												</div>
											</div>
										)}

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
																m.opponent
																	.color,
														}}
													></div>
													{m.opponent.name}
												</div>
											</div>
											<div className="text-right">
												{m.bestTime ? (
													<div className="text-yellow-500 text-xs">
														Best:{' '}
														{m.bestTime.toFixed(3)}s
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
											onClick={(e) => {
												e.stopPropagation();
												onStartMission(m);
											}}
											className={`w-full mt-4 pixel-btn ${
												isBoss
													? 'bg-yellow-600 border-yellow-800 hover:bg-yellow-500'
													: ''
											}`}
											style={
												isBoss
													? {
															backgroundColor:
																'#ca8a04',
															borderColor:
																'#854d0e',
													  }
													: {}
											}
										>
											RACE
										</button>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					// UNDERGROUND TAB
					<div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-500">
						<div className="text-purple-500 text-xl mb-2 pixel-text">
							THE UNDERGROUND
						</div>
						<div className="text-gray-400 text-sm mb-8">
							Infinite Procedural Rivals
						</div>

						<div className="pixel-panel p-8 bg-black/80 border-purple-900 w-full max-w-md relative overflow-hidden">
							<div className="absolute top-0 right-0 bg-purple-900 text-white text-xs px-3 py-1">
								LEVEL {undergroundLevel}
							</div>

							<div className="flex flex-col items-center">
								<div className="w-32 h-32 mb-6 relative">
									{/* Silhouette or Icon */}
									<div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
									<svg
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										className="w-full h-full text-purple-500 relative z-10"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={1}
											d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
										/>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={1}
											d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
								</div>

								<h3 className="text-2xl text-white pixel-text mb-1">
									{currentRival.name}
								</h3>
								<div className="text-purple-400 text-sm mb-6">
									Difficulty Rating:{' '}
									{currentRival.difficulty.toFixed(1)}
								</div>

								<div className="w-full grid grid-cols-2 gap-4 mb-8">
									<div className="bg-gray-900 p-3 rounded border border-gray-800">
										<div className="text-[10px] text-gray-500 uppercase">
											Power
										</div>
										<div className="text-white font-mono">
											{(
												(currentRival.tuning.maxTorque *
													currentRival.tuning
														.redlineRPM) /
												7023
											).toFixed(0)}{' '}
											HP
										</div>
									</div>
									<div className="bg-gray-900 p-3 rounded border border-gray-800">
										<div className="text-[10px] text-gray-500 uppercase">
											Reward
										</div>
										<div className="text-green-400 font-mono">
											${500 + undergroundLevel * 100}
										</div>
									</div>
								</div>

								<button
									onClick={handleStartUnderground}
									className="w-full pixel-btn bg-purple-600 hover:bg-purple-500 text-white py-4 text-xl shadow-[0_0_20px_rgba(168,85,247,0.4)]"
									style={{
										backgroundColor: '#9333ea',
										borderColor: '#7e22ce',
									}}
								>
									CHALLENGE RIVAL
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default MissionSelect;
