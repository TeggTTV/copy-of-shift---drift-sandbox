import React from 'react';

interface PixelSliderProps {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	showValue?: boolean;
}

const PixelSlider: React.FC<PixelSliderProps> = ({
	value,
	onChange,
	min = 0,
	max = 100,
	step = 1,
	disabled = false,
	showValue = false,
}) => {
	const percentage = ((value - min) / (max - min)) * 100;
	const segments = 20; // Number of segments in the bar

	return (
		<div className="w-full">
			<div className="relative h-6 bg-gray-800 border-2 border-gray-700 pixel-corners overflow-hidden">
				{/* Segmented fill bars */}
				<div className="absolute inset-0 flex gap-[2px] p-[2px]">
					{Array.from({ length: segments }).map((_, i) => {
						const segmentPercentage = (i / segments) * 100;
						const isActive = segmentPercentage < percentage;

						return (
							<div
								key={i}
								className={`flex-1 transition-all duration-150 ${
									isActive
										? disabled
											? 'bg-gray-600'
											: 'bg-gradient-to-b from-cyan-400 to-cyan-600 shadow-[0_0_4px_rgba(34,211,238,0.5)]'
										: 'bg-gray-900/50'
								}`}
								style={{
									boxShadow:
										isActive && !disabled
											? '0 0 4px rgba(34, 211, 238, 0.5)'
											: 'none',
								}}
							/>
						);
					})}
				</div>

				{/* Hidden range input for interaction */}
				<input
					type="range"
					min={min}
					max={max}
					step={step}
					value={value}
					onChange={(e) => onChange(Number(e.target.value))}
					disabled={disabled}
					className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
				/>

				{/* Value display (optional) */}
				{showValue && (
					<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
						<span className="text-xs font-bold text-white pixel-text drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
							{Math.round(value)}
						</span>
					</div>
				)}
			</div>
		</div>
	);
};

export default PixelSlider;
