import React, { useState } from 'react';
import { JunkyardCar } from '../../types';
import { useSound } from '../../contexts/SoundContext';

interface JunkyardProps {
	cars: JunkyardCar[];
	money: number;
	onBuyCar: (car: JunkyardCar) => void;
	onBack: () => void;
	onRefresh: () => void;
	refreshCost?: number;
}

const Junkyard: React.FC<JunkyardProps> = ({
	cars,
	money,
	onBuyCar,
	onBack,
	onRefresh,
	refreshCost = 100,
}) => {
	const { play } = useSound();
	const [hoveredCar, setHoveredCar] = useState<string | null>(null);

	const renderParticles = (rarity: string) => {
		if (rarity !== 'LEGENDARY' && rarity !== 'EXOTIC') return null;

		const particleCount = rarity === 'EXOTIC' ? 16 : 12;
		const particles = [];

		for (let i = 0; i < particleCount; i++) {
			let style: React.CSSProperties = {};
			const delay = Math.random() * 2;
			const duration = 1.5 + Math.random();

			// Spawn on border for both
			const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
			const pos = Math.random() * 100;
			const size = 3 + Math.random() * 3;

			switch (side) {
				case 0: // Top
					style = { top: '-6px', left: `${pos}%` };
					break;
				case 1: // Right
					style = { right: '-6px', top: `${pos}%` };
					break;
				case 2: // Bottom
					style = { bottom: '-6px', left: `${pos}%` };
					break;
				case 3: // Left
					style = { left: '-6px', top: `${pos}%` };
					break;
			}

			if (rarity === 'EXOTIC') {
				style = {
					...style,
					width: `${size}px`,
					height: `${size}px`,
					backgroundColor: '#f472b6', // Pink-400
					animationName: 'twinkle',
					animationDuration: `${duration}s`,
					animationDelay: `${delay}s`,
					boxShadow: '0 0 4px #ec4899',
				};
			} else {
				// Legendary (Gold)
				style = {
					...style,
					width: `${size}px`,
					height: `${size}px`,
					backgroundColor: '#fbbf24', // Gold
					animationName: 'twinkle',
					animationDuration: `${duration}s`,
					animationDelay: `${delay}s`,
					boxShadow: '0 0 4px #d97706',
				};
			}

			particles.push(
				<div key={i} className="pixel-particle" style={style} />
			);
		}

		return <>{particles}</>;
	};

	return (
		<div className="absolute inset-0 bg-neutral-900 flex flex-col items-center py-10 text-white z-50 overflow-y-auto font-pixel">
			<div className="w-full max-w-6xl px-4">
				<div className="flex justify-between items-center mb-8">
					<button
						onClick={onBack}
						className="text-gray-400 hover:text-white text-xs"
					>
						&lt; BACK
					</button>
					<div className="flex flex-col items-center">
						<h2 className="text-3xl text-orange-600 pixel-text tracking-widest">
							THE JUNKYARD
						</h2>
						<p className="text-gray-500 text-xs">
							One man's trash is another man's treasure.
						</p>
					</div>
					<div className="text-green-400 text-xl pixel-text">
						${money.toLocaleString()}
					</div>
				</div>

				<div className="flex justify-end mb-4">
					<button
						onClick={onRefresh}
						className="pixel-btn bg-gray-800 text-xs py-2 px-4 hover:bg-gray-700"
					>
						REFRESH STOCK (${refreshCost})
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{cars.map((car) => {
						const conditionColor =
							(car.condition || 0) > 0.7
								? 'text-green-500'
								: (car.condition || 0) > 0.4
								? 'text-yellow-500'
								: 'text-red-500';

						const rarity = car.rarity || 'COMMON';
						let borderColor = 'border-gray-800';
						let rarityColor = 'text-gray-400';
						let badgeBg = 'bg-gray-800';
						let cardBg = 'bg-black';

						switch (rarity) {
							case 'UNCOMMON':
								borderColor =
									'border-green-900/50 hover:border-green-500';
								rarityColor = 'text-green-400';
								badgeBg = 'bg-green-900/80 text-green-200';
								break;
							case 'RARE':
								borderColor =
									'border-blue-900/50 hover:border-blue-500';
								rarityColor = 'text-blue-400';
								badgeBg = 'bg-blue-900/80 text-blue-200';
								break;
							case 'EPIC':
								borderColor =
									'border-purple-900/50 hover:border-purple-500';
								rarityColor = 'text-purple-400';
								badgeBg = 'bg-purple-900/80 text-purple-200';
								break;
							case 'LEGENDARY':
								borderColor =
									'rarity-legendary border-transparent';
								rarityColor = 'text-yellow-400';
								badgeBg =
									'bg-yellow-900/80 text-yellow-200 animate-pulse';
								cardBg = ''; // Handled by CSS
								break;
							case 'EXOTIC':
								borderColor =
									'rarity-exotic border-transparent';
								rarityColor = 'text-pink-400';
								badgeBg =
									'bg-pink-900/80 text-pink-200 animate-pulse font-bold tracking-wider';
								cardBg = ''; // Handled by CSS
								break;
							default:
								borderColor =
									'border-gray-800 hover:border-gray-600';
						}

						return (
							<div
								key={car.id}
								onMouseEnter={() => setHoveredCar(car.id)}
								onMouseLeave={() => setHoveredCar(null)}
								className={`pixel-panel p-4 relative group transition-all duration-300 ${borderColor} ${cardBg}`}
							>
								<div
									className={`absolute top-2 right-2 text-[10px] px-2 py-1 rounded ${badgeBg} z-10`}
								>
									{rarity}
								</div>
								{renderParticles(rarity)}

								<div className="mb-4">
									<h3
										className={`text-xl pixel-text mb-1 ${rarityColor}`}
									>
										{car.name}
									</h3>
									<div className="flex items-center gap-2 text-xs text-gray-400">
										<span>
											Mods: {car.ownedMods.length}
										</span>
									</div>
								</div>

								<div className="bg-gray-900 p-3 rounded mb-4 border border-gray-800">
									<div className="flex justify-between items-center mb-2">
										<span className="text-xs text-gray-500 uppercase">
											Condition
										</span>
										<span
											className={`font-bold ${conditionColor}`}
										>
											{(
												(car.condition || 0) * 100
											).toFixed(0)}
											%
										</span>
									</div>
									<div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
										<div
											className={`h-full ${
												(car.condition || 0) > 0.7
													? 'bg-green-500'
													: (car.condition || 0) > 0.4
													? 'bg-yellow-500'
													: 'bg-red-500'
											}`}
											style={{
												width: `${
													(car.condition || 0) * 100
												}%`,
											}}
										></div>
									</div>
									<div className="mt-2 text-[10px] text-center">
										<span className="text-gray-500">
											Potential Value:{' '}
										</span>
										<span className={rarityColor}>
											$
											{(
												car.originalPrice || 0
											).toLocaleString()}
										</span>
									</div>
								</div>

								<div className="flex justify-between items-end mt-auto">
									<div>
										<div className="text-[10px] text-gray-500 uppercase">
											Price
										</div>
										<div className="text-green-400 text-xl font-bold">
											${car.price.toLocaleString()}
										</div>
									</div>
									<button
										onClick={() => onBuyCar(car)}
										className="pixel-btn bg-orange-900/20 border-orange-800 text-orange-500 hover:bg-orange-900/40 py-2 px-6"
									>
										BUY
									</button>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default Junkyard;
