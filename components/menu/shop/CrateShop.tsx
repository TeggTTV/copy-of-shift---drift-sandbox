import React, { useState } from 'react';
import { CRATES, ItemGenerator } from '@/utils/ItemGenerator';
import { Crate, InventoryItem } from '@/types';

interface CrateShopProps {
	money: number;
	onBuyCrate: (crate: Crate, amount: number) => void;
	onItemReveal: (items: InventoryItem[]) => void;
}

export const CrateShop: React.FC<CrateShopProps> = ({
	money,
	onBuyCrate,
	onItemReveal,
}) => {
	const [openingCrate, setOpeningCrate] = useState<Crate | null>(null);
	const [revealedItems, setRevealedItems] = useState<InventoryItem[]>([]);
	const [openingAmount, setOpeningAmount] = useState(1);
	const [isAnimating, setIsAnimating] = useState(false);

	const handleBuy = (crate: Crate, amount: number) => {
		if (money < crate.price * amount) return;

		setOpeningCrate(crate);
		setOpeningAmount(amount);
		setIsAnimating(true);
		onBuyCrate(crate, amount);

		// Simulate animation delay
		setTimeout(() => {
			const newItems: InventoryItem[] = [];
			for (let i = 0; i < amount; i++) {
				newItems.push(ItemGenerator.openCrate(crate));
			}
			setRevealedItems(newItems);
			onItemReveal(newItems);
			setIsAnimating(false);
		}, 2000);
	};

	const closeReveal = () => {
		setOpeningCrate(null);
		setRevealedItems([]);
		setIsAnimating(false);
	};

	if (openingCrate) {
		return (
			<div className="w-full h-full flex flex-col items-center justify-center bg-black/95 absolute inset-0 z-50 p-8 font-pixel">
				{isAnimating ? (
					<div className="flex flex-col items-center animate-pulse">
						<div className="flex gap-4">
							{Array.from({ length: openingAmount }).map(
								(_, i) => (
									<div
										key={i}
										className="w-32 h-32 bg-yellow-900/50 border-2 border-yellow-600 rounded-lg shadow-[0_0_30px_rgba(234,179,8,0.2)] flex items-center justify-center animate-bounce"
										style={{
											animationDelay: `${i * 0.1}s`,
										}}
									>
										<span className="text-4xl">📦</span>
									</div>
								)
							)}
						</div>
						<div className="text-2xl font-bold text-white pixel-text mt-8">
							OPENING {openingCrate.name} (x{openingAmount})...
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center animate-in zoom-in duration-300 w-full max-w-6xl">
						<div className="text-yellow-400 font-bold text-2xl mb-8 pixel-text">
							ITEMS ACQUIRED!
						</div>

						<div className="flex flex-wrap justify-center gap-6 mb-8 w-full">
							{revealedItems.map((item, idx) => (
								<div
									key={idx}
									className="bg-gray-900 border-4 rounded-lg flex flex-col items-center p-4 shadow-2xl relative w-64 group"
									style={{
										borderColor:
											ItemGenerator.getRarityColor(
												item.rarity
											),
										boxShadow: `0 0 20px ${ItemGenerator.getRarityColor(
											item.rarity
										)}40`,
									}}
								>
									{/* <div className="text-4xl mb-2">
										{item.rarity === 'LEGENDARY'
											? '🌟'
											: item.rarity === 'EPIC'
											? '🟣'
											: item.rarity === 'RARE'
											? '🔵'
											: item.rarity === 'UNCOMMON'
											? '🟢'
											: '⚪'}
									</div> */}
									<div
										className="text-lg font-bold text-center mb-1 break-words w-full px-2 leading-tight"
										style={{
											color: ItemGenerator.getRarityColor(
												item.rarity
											),
										}}
									>
										{item.name}
									</div>
									<div className="text-gray-500 text-[10px] mb-3 uppercase">
										{item.rarity} {item.type}
									</div>

									<div className="w-full bg-black/50 rounded p-2 text-xs space-y-1">
										{Object.entries(item.stats).map(
											([key, val]) => {
												if (typeof val !== 'number')
													return null;
												return (
													<div
														key={key}
														className="flex justify-between text-gray-400"
													>
														<span className="capitalize">
															{key
																.replace(
																	/([A-Z]+)([A-Z][a-z])/g,
																	'$1 $2'
																)
																.replace(
																	/([a-z\d])([A-Z])/g,
																	'$1 $2'
																)}
														</span>
														<span className="text-white font-mono">
															{val.toString()[0] ==
															'-'
																? val
																: '+' + val}
														</span>
													</div>
												);
											}
										)}
										{Object.keys(item.stats).length ===
											0 && (
											<div className="text-gray-600 italic text-center">
												No stats
											</div>
										)}
									</div>
								</div>
							))}
						</div>

						<button
							onClick={closeReveal}
							className="px-12 py-4 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 pixel-text text-xl shadow-lg border-b-4 border-blue-800 active:border-b-0 active:translate-y-1"
						>
							CONTINUE TO SHOP
						</button>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="w-full h-full p-4 overflow-y-auto font-pixel">
			<div className="flex justify-center mb-8">
				<div className="text-center">
					<h2 className="text-3xl font-bold text-white pixel-text mb-2">
						SUPPLY CRATES
					</h2>
					<p className="text-gray-400 text-sm">
						Purchase randomized parts for your build.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-6 max-w-5xl mx-auto">
				{CRATES.map((crate) => (
					<div
						key={crate.id}
						className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col md:flex-row gap-6 hover:border-gray-500 transition-all group relative overflow-hidden"
					>
						{/* Crate Visual */}
						<div className="bg-black/40 p-6 rounded-lg flex items-center justify-center border border-gray-800 w-full md:w-48 aspect-square shrink-0">
							<span className="text-7xl group-hover:scale-110 transition-transform">
								📦
							</span>
						</div>

						{/* Info */}
						<div className="flex-1 flex flex-col">
							<h3 className="text-2xl font-bold text-white mb-2">
								{crate.name}
							</h3>
							<p className="text-gray-400 text-sm mb-4 h-10">
								{crate.description}
							</p>

							{/* Probabilities */}
							<div className="flex gap-4 mb-4 text-xs font-mono bg-black/20 p-2 rounded w-fit">
								{Object.entries(crate.dropRates).map(
									([rarity, rate]) => {
										if (rate === 0) return null;
										const color =
											ItemGenerator.getRarityColor(
												rarity as any
											);
										return (
											<div
												key={rarity}
												style={{ color }}
												className="flex flex-col items-center px-2 border-r border-gray-800 last:border-0"
											>
												<span className="font-bold">
													{(rate * 100).toFixed(0)}%
												</span>
												<span className="opacity-70 text-[10px]">
													{rarity.slice(0, 3)}
												</span>
											</div>
										);
									}
								)}
							</div>

							{/* Buttons */}
							<div className="mt-auto flex gap-4">
								<button
									onClick={() => handleBuy(crate, 1)}
									disabled={money < crate.price}
									className={`
                                        flex-1 py-3 px-4 font-bold rounded pixel-text transition-colors flex items-center justify-center gap-2
                                        ${
											money >= crate.price
												? 'bg-green-700 hover:bg-green-600 text-white border-b-4 border-green-900 active:border-b-0 active:translate-y-1'
												: 'bg-gray-800 text-gray-500 cursor-not-allowed'
										}
                                    `}
								>
									<span>BUY 1</span>
									<span className="text-green-300 font-mono text-sm bg-black/30 px-2 rounded">
										${crate.price.toLocaleString()}
									</span>
								</button>

								<button
									onClick={() => handleBuy(crate, 5)}
									disabled={money < crate.price * 5}
									className={`
                                        flex-1 py-3 px-4 font-bold rounded pixel-text transition-colors flex items-center justify-center gap-2
                                        ${
											money >= crate.price * 5
												? 'bg-indigo-700 hover:bg-indigo-600 text-white border-b-4 border-indigo-900 active:border-b-0 active:translate-y-1'
												: 'bg-gray-800 text-gray-500 cursor-not-allowed'
										}
                                    `}
								>
									<span>BUY 5</span>
									<span className="text-indigo-300 font-mono text-sm bg-black/30 px-2 rounded min-w-[60px] text-center">
										${(crate.price * 5).toLocaleString()}
									</span>
								</button>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
