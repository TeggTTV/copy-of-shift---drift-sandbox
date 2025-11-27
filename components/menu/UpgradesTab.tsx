import React from 'react';
import { ModNode, TuningState } from '../../types';
import PerformanceMetrics, { StatDiff } from './PerformanceMetrics';

interface UpgradesTabProps {
	playerTuning: TuningState;
	ownedMods: string[];
	setOwnedMods: (mod: ModNode) => void;
	money: number;
	disabledMods: string[];
	setDisabledMods: React.Dispatch<React.SetStateAction<string[]>>;
	previewTuning: TuningState | null;
}

const UpgradesTab: React.FC<UpgradesTabProps> = ({
	playerTuning,
	ownedMods,
	previewTuning,
}) => {
	return (
		<div className="space-y-4 font-mono text-sm">
			<div className="flex justify-between border-b border-gray-800 pb-2">
				<span className="text-gray-500">PEAK TORQUE</span>
				<span className="text-white font-bold">
					{playerTuning.maxTorque} Nm
					<StatDiff
						current={playerTuning.maxTorque}
						preview={previewTuning?.maxTorque}
						suffix=" Nm"
					/>
				</span>
			</div>
			<div className="flex justify-between border-b border-gray-800 pb-2">
				<span className="text-gray-500">PEAK POWER</span>
				<span className="text-white font-bold">
					{Math.round(
						(playerTuning.maxTorque * playerTuning.redlineRPM) /
							9549
					)}{' '}
					HP
					<StatDiff
						current={Math.round(
							(playerTuning.maxTorque * playerTuning.redlineRPM) /
								9549
						)}
						preview={
							previewTuning
								? Math.round(
										(previewTuning.maxTorque *
											previewTuning.redlineRPM) /
											9549
								  )
								: null
						}
						suffix=" HP"
					/>
				</span>
			</div>
			<div className="flex justify-between border-b border-gray-800 pb-2">
				<span className="text-gray-500">REDLINE</span>
				<span className="text-white font-bold">
					{playerTuning.redlineRPM} RPM
					<StatDiff
						current={playerTuning.redlineRPM}
						preview={previewTuning?.redlineRPM}
						suffix=" RPM"
					/>
				</span>
			</div>
			<div className="flex justify-between border-b border-gray-800 pb-2">
				<span className="text-gray-500">WEIGHT</span>
				<span className="text-white font-bold">
					{playerTuning.mass} KG
					<StatDiff
						current={playerTuning.mass}
						preview={previewTuning?.mass}
						suffix=" KG"
						invertColor={true}
					/>
				</span>
			</div>

			<PerformanceMetrics
				tuning={playerTuning}
				previewTuning={previewTuning}
			/>

			{/* Car Preview */}
			<h3 className="text-xl font-bold text-gray-300 mt-8 mb-4">
				CAR PREVIEW
			</h3>
			<div className="bg-slate-800 border border-gray-800 rounded-lg p-4">
				<svg width="100%" height="180" viewBox="0 0 120 180">
					<rect
						x="35"
						y="55"
						width="50"
						height="90"
						fill="rgba(0,0,0,0.3)"
					/>
					<rect
						x="30"
						y="50"
						width="60"
						height="100"
						fill={playerTuning.color}
						stroke="#000"
						strokeWidth="2"
						rx="4"
					/>
					<rect
						x="35"
						y="80"
						width="50"
						height="30"
						fill="rgba(0,0,0,0.3)"
						rx="2"
					/>
					<rect x="32" y="52" width="12" height="6" fill="#fff9c4" />
					<rect x="76" y="52" width="12" height="6" fill="#fff9c4" />
					<rect x="32" y="142" width="12" height="4" fill="#ef4444" />
					<rect x="76" y="142" width="12" height="4" fill="#ef4444" />
					<circle
						cx="40"
						cy="70"
						r="8"
						fill="#333"
						stroke="#666"
						strokeWidth="2"
					/>
					<circle
						cx="80"
						cy="70"
						r="8"
						fill="#333"
						stroke="#666"
						strokeWidth="2"
					/>
					<circle
						cx="40"
						cy="130"
						r="8"
						fill="#333"
						stroke="#666"
						strokeWidth="2"
					/>
					<circle
						cx="80"
						cy="130"
						r="8"
						fill="#333"
						stroke="#666"
						strokeWidth="2"
					/>
					{ownedMods.some((id) =>
						['spoiler', 'splitter', 'diffuser'].includes(id)
					) && (
						<>
							<rect
								x="25"
								y="145"
								width="70"
								height="3"
								fill="#666"
							/>
							<rect
								x="28"
								y="148"
								width="64"
								height="2"
								fill="#444"
							/>
						</>
					)}
					{(ownedMods.includes('turbo_kit') ||
						ownedMods.includes('big_turbo') ||
						ownedMods.includes('supercharger')) && (
						<text
							x="60"
							y="25"
							fontSize="10"
							fill="#f59e0b"
							textAnchor="middle"
							fontWeight="bold"
						>
							{ownedMods.includes('supercharger')
								? 'SC'
								: 'TURBO'}
						</text>
					)}
					{ownedMods.some((id) => id.startsWith('nitrous_')) && (
						<text
							x="60"
							y="170"
							fontSize="10"
							fill="#ec4899"
							textAnchor="middle"
							fontWeight="bold"
						>
							NOS
						</text>
					)}
				</svg>
			</div>
		</div>
	);
};

export default UpgradesTab;
