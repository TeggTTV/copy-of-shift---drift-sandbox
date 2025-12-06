import React from 'react';
import Dashboard from '../Dashboard';
import { TopBar } from '../menu/TopBar';
import { CarState, TuningState, Mission } from '../../types';

interface GameHUDProps {
	phase: string;
	mission: Mission | null;
	uiState: {
		player: CarState;
		opponent: CarState;
	};
	playerTuning: TuningState;
	missedGearAlert: boolean;
	countdownNum: number | string;
	raceResult: 'WIN' | 'LOSS' | null;
	level: number;
	xp: number;
	money: number;
	currentWager: number;
	playerFinishTime: number;
	opponentFinishTime: number;
	onStartMission: (m: Mission) => void;
	onBackToMenu: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
	phase,
	mission,
	uiState,
	playerTuning,
	missedGearAlert,
	countdownNum,
	raceResult,
	level,
	xp,
	money,
	currentWager,
	playerFinishTime,
	opponentFinishTime,
	onStartMission,
	onBackToMenu,
}) => {
	if (phase !== 'RACE') return null;

	return (
		<>
			{/* HUD only in Race */}
			{mission && (
				<>
					<Dashboard
						carState={uiState.player}
						tuning={playerTuning}
						opponentState={uiState.opponent}
						raceDistance={mission.distance}
						missedGear={missedGearAlert}
					/>
					{/* Countdown Overlay */}
					{countdownNum !== '' && (
						<div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
							<div
								className={`text-9xl font-black italic tracking-tighter ${
									countdownNum === 'GO!'
										? 'text-green-500 scale-150'
										: 'text-white'
								} transition-all duration-300 drop-shadow-2xl`}
							>
								{countdownNum}
							</div>
						</div>
					)}
				</>
			)}

			{/* Race Results Overlay */}
			{raceResult && (
				<div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] animate-in fade-in duration-500">
					{/* TopBar for XP/Level Animations */}
					<div className="absolute top-0 left-0 right-0 z-50">
						<TopBar
							level={level}
							xp={xp}
							money={money}
							initialXp={
								raceResult === 'WIN'
									? xp - (mission?.xpReward || 100)
									: xp
							}
							initialMoney={
								raceResult === 'WIN'
									? money -
									  (mission?.payout || 0) -
									  currentWager
									: raceResult === 'LOSS'
									? money + currentWager
									: money
							}
						/>
					</div>

					<h1
						className={`text-8xl font-black italic mb-4 ${
							raceResult === 'WIN'
								? 'text-green-500'
								: 'text-red-500'
						}`}
					>
						{raceResult === 'WIN' ? 'VICTORY' : 'DEFEAT'}
					</h1>
					<div className="text-4xl font-mono text-white mb-2">
						TIME: {playerFinishTime.toFixed(3)}s
					</div>
					{raceResult === 'WIN' && (
						<div className="text-2xl text-green-400 font-mono mb-8">
							EARNED ${mission?.payout}
						</div>
					)}
					{raceResult === 'LOSS' && (
						<div className="text-2xl text-red-400 font-mono mb-8">
							+
							{(playerFinishTime - opponentFinishTime).toFixed(3)}
							s
						</div>
					)}
					<div className="flex gap-4 mt-8">
						<button
							onClick={() => mission && onStartMission(mission)}
							className="px-8 py-4 bg-white text-black font-bold text-xl hover:bg-gray-200 uppercase"
						>
							{raceResult === 'WIN' ? 'Race Again' : 'Retry'}
						</button>
						<button
							onClick={onBackToMenu}
							className="px-8 py-4 bg-gray-800 text-white font-bold text-xl hover:bg-gray-700 uppercase"
						>
							Back to Menu
						</button>
					</div>
				</div>
			)}
		</>
	);
};
