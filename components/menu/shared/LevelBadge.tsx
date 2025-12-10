import React from 'react';

export const LevelBadge = ({
	level,
	scale,
}: {
	level: number;
	scale?: number;
}) => {
	let tierClass = 'border-gray-600 text-gray-400';
	let bgClass = 'bg-gray-800';
	let wings = false;

	if (level >= 100) {
		tierClass = 'rarity-rainbow text-white border-transparent';
		bgClass = 'bg-black';
		wings = true;
	} else if (level >= 75) {
		tierClass = 'rarity-exotic text-pink-400 border-transparent';
		bgClass = 'bg-pink-950';
	} else if (level >= 50) {
		tierClass = 'rarity-legendary text-yellow-400 border-transparent';
		bgClass = 'bg-yellow-950';
	} else if (level >= 25) {
		tierClass =
			'border-blue-400 text-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]';
		bgClass = 'bg-blue-950';
	} else if (level >= 10) {
		tierClass =
			'border-orange-600 text-orange-400 shadow-[0_0_5px_rgba(234,88,12,0.3)]';
		bgClass = 'bg-orange-950';
	}

	return (
		<div
			className="relative flex items-center justify-center group"
			style={{ transform: `scale(${scale || 1})` }}
		>
			{/* Wings for max level */}
			{wings && (
				<>
					<div className="absolute -left-8 top-1/2 -translate-y-1/2 w-8 h-12 bg-gradient-to-r from-transparent to-purple-500/20 clip-path-wing-left animate-pulse"></div>
					<div className="absolute -right-8 top-1/2 -translate-y-1/2 w-8 h-12 bg-gradient-to-l from-transparent to-purple-500/20 clip-path-wing-right animate-pulse"></div>
				</>
			)}

			<div
				className={`
                relative w-12 h-12 flex items-center justify-center 
                border-4 ${tierClass} ${bgClass} 
				transform rotate-45 
				`}
				// transition-transform
				// duration-300
				// group-hover:rotate-0
			>
				{/* Animated Border Fill for Level Up (Optional, requires more complex CSS or SVG) */}
				{/* For now, we rely on the tier class change */}

				<div
					className="transform -rotate-45 
				flex flex-col items-center h-full w-full justify-center"
				>
					{/* group-hover:rotate-0 transition-transform duration-300  */}
					<span className="text-[8px] uppercase tracking-widest opacity-70 mb-1">
						LVL
					</span>
					<div className="relative h-6 w-full text-center">
						<span
							key={level} // Key change triggers animation if we set it up, but here we use CSS animation class
							className={`${
								level >= 100 ? 'text-sm' : 'text-xl'
							} font-bold pixel-text leading-none block animate-slide-up-enter`}
						>
							{level}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};
