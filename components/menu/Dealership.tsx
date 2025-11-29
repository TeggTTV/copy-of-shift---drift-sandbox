import React from 'react';
import { JunkyardCar } from '../../types';
import { useSound } from '../../contexts/SoundContext';

interface DealershipProps {
	cars: JunkyardCar[];
	money: number;
	onBuyCar: (car: JunkyardCar) => void;
	onBack: () => void;
	onRefresh: () => void;
}

const Dealership: React.FC<DealershipProps> = ({
	cars,
	money,
	onBuyCar,
	onBack,
	onRefresh,
}) => {
	const { play } = useSound();

	return (
		<div className="absolute inset-0 bg-slate-900 flex flex-col items-center py-10 text-white z-50 overflow-y-auto font-pixel">
			<div className="w-full max-w-6xl px-4">
				<div className="flex justify-between items-center mb-8">
					<button
						onClick={onBack}
						className="text-gray-400 hover:text-white text-xs"
					>
						&lt; BACK
					</button>
					<div className="flex flex-col items-center">
						<h2 className="text-3xl text-blue-400 pixel-text tracking-widest">
							PREMIUM PRE-OWNED
						</h2>
						<p className="text-gray-400 text-xs">
							Quality cars at fair market prices.
						</p>
					</div>
					<div className="text-green-400 text-xl pixel-text">
						${money.toLocaleString()}
					</div>
				</div>

				<div className="flex justify-end mb-4">
					<button
						onClick={onRefresh}
						className="pixel-btn bg-slate-800 text-xs py-2 px-4 hover:bg-slate-700 border-slate-600"
					>
						NEW ARRIVALS ($500)
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{cars.map((car) => {
						const isCertified = (car.condition || 0) > 0.85;

						return (
							<div
								key={car.id}
								className={`pixel-panel p-4 bg-slate-950 border-slate-700 relative group hover:border-blue-500 transition-colors ${
									isCertified ? 'border-blue-400/50' : ''
								}`}
							>
								{isCertified && (
									<div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-2 py-1 rounded font-bold shadow-lg shadow-blue-900/50">
										CERTIFIED
									</div>
								)}

								<div className="mb-4">
									<h3 className="text-xl text-white pixel-text mb-1">
										{car.name}
									</h3>
									<div className="flex items-center gap-2 text-xs text-gray-400">
										<span>
											Mods: {car.ownedMods.length}
										</span>
									</div>
								</div>

								<div className="bg-slate-900 p-3 rounded mb-4 border border-slate-800">
									<div className="flex justify-between items-center mb-2">
										<span className="text-xs text-gray-500 uppercase">
											Condition
										</span>
										<span className="font-bold text-blue-400">
											{(
												(car.condition || 0) * 100
											).toFixed(0)}
											%
										</span>
									</div>
									<div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
										<div
											className="h-full bg-blue-500"
											style={{
												width: `${
													(car.condition || 0) * 100
												}%`,
											}}
										></div>
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
										className="pixel-btn bg-blue-900/20 border-blue-800 text-blue-400 hover:bg-blue-900/40 py-2 px-6"
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

export default Dealership;
