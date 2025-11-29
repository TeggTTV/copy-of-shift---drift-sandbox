import React from 'react';
import { JunkyardCar } from '../../types';
import { useSound } from '../../contexts/SoundContext';

interface JunkyardProps {
	cars: JunkyardCar[];
	money: number;
	onBuyCar: (car: JunkyardCar) => void;
	onBack: () => void;
	onRefresh: () => void;
}

const Junkyard: React.FC<JunkyardProps> = ({
	cars,
	money,
	onBuyCar,
	onBack,
	onRefresh,
}) => {
	const { play } = useSound();

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
						REFRESH STOCK ($100)
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

						const isRare = (car.originalPrice || 0) > 20000;

						return (
							<div
								key={car.id}
								className={`pixel-panel p-4 bg-black border-orange-900/50 relative group hover:border-orange-500 transition-colors ${
									isRare
										? 'border-purple-900/50 hover:border-purple-500'
										: ''
								}`}
							>
								<div
									className={`absolute top-2 right-2 text-[10px] px-2 py-1 rounded ${
										isRare
											? 'bg-purple-900/80 text-purple-200 animate-pulse'
											: 'bg-orange-900/80 text-orange-200'
									}`}
								>
									{isRare ? 'RARE FIND' : 'JUNK'}
								</div>

								<div className="mb-4">
									<h3
										className={`text-xl pixel-text mb-1 ${
											isRare
												? 'text-purple-400'
												: 'text-white'
										}`}
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
										<span
											className={
												isRare
													? 'text-purple-400'
													: 'text-gray-300'
											}
										>
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
