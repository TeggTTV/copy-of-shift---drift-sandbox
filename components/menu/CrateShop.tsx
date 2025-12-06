import React, { useState } from 'react';
import { CRATES, ItemGenerator } from '../../utils/ItemGenerator';
import { Crate, InventoryItem } from '../../types';

interface CrateShopProps {
	money: number;
	onBuyCrate: (crate: Crate) => void;
	onItemReveal: (item: InventoryItem) => void;
}

export const CrateShop: React.FC<CrateShopProps> = ({
	money,
	onBuyCrate,
	onItemReveal,
}) => {
	const [openingCrate, setOpeningCrate] = useState<Crate | null>(null);
	const [revealedItem, setRevealedItem] = useState<InventoryItem | null>(
		null
	);

	const handleBuy = (crate: Crate) => {
		if (money < crate.price) return;

		setOpeningCrate(crate);
		onBuyCrate(crate);

		// Simulate animation delay
		setTimeout(() => {
			const newItem = ItemGenerator.openCrate(crate);
			setRevealedItem(newItem);
			onItemReveal(newItem);
		}, 1500);
	};

	const closeReveal = () => {
		setOpeningCrate(null);
		setRevealedItem(null);
	};

	if (openingCrate) {
		return (
			<div className="w-full h-full flex flex-col items-center justify-center bg-black/90 p-8">
				{!revealedItem ? (
					<div className="flex flex-col items-center animate-pulse">
						<div className="w-32 h-32 bg-yellow-600 rounded-lg shadow-[0_0_30px_rgba(234,179,8,0.5)] mb-8 flex items-center justify-center">
							<span className="text-4xl">📦</span>
						</div>
						<div className="text-2xl font-bold text-white pixel-text">
							OPENING {openingCrate.name}...
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center animate-in zoom-in duration-300">
						<div className="text-yellow-400 font-bold text-xl mb-4 pixel-text">
							ITEM ACQUIRED!
						</div>
						<div
							className="w-64 bg-gray-900 border-4 rounded-lg flex flex-col items-center p-6 mb-8 shadow-2xl relative"
							style={{
								borderColor: ItemGenerator.getRarityColor(
									revealedItem.rarity
								),
								boxShadow: `0 0 50px ${ItemGenerator.getRarityColor(
									revealedItem.rarity
								)}40`, // 40 is alpha
							}}
						>
							<div
								className="text-2xl font-bold text-center mb-2 break-words w-full px-2"
								style={{
									color: ItemGenerator.getRarityColor(
										revealedItem.rarity
									),
									wordBreak: 'break-word',
								}}
							>
								{revealedItem.name}
							</div>
							<div className="text-white text-sm mb-4">
								{revealedItem.rarity} {revealedItem.type}
							</div>

							{/* Stats Display */}
							<div className="w-full bg-black/50 rounded p-3 text-sm">
								{Object.entries(revealedItem.stats).map(
									([key, val]) => {
										if (typeof val !== 'number')
											return null;
										return (
											<div
												key={key}
												className="flex justify-between text-gray-300"
											>
												<span className="capitalize">
													{key.replace(
														/([A-Z])/g,
														' $1'
													)}
												</span>
												<span className="text-white font-mono font-bold">
													{val > 0 ? '+' : ''}
													{val}
												</span>
											</div>
										);
									}
								)}
								{Object.keys(revealedItem.stats).length ===
									0 && (
									<div className="text-gray-500 italic text-center">
										No stats
									</div>
								)}
							</div>
						</div>
						<button
							onClick={closeReveal}
							className="px-8 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-500 pixel-text"
						>
							CONTINUE
						</button>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="w-full h-full p-4 overflow-auto">
			<h2 className="text-3xl font-bold text-white pixel-text mb-8 text-center">
				SUPPLY CRATES
			</h2>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{CRATES.map((crate) => (
					<div
						key={crate.id}
						className="bg-gray-800 border-2 border-gray-700 rounded-lg p-4 flex flex-col hover:border-gray-500 transition-all hover:-translate-y-1 relative group"
					>
						{/* Glow effect on hover */}
						<div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

						<div className="w-full aspect-square bg-gray-900 rounded mb-4 flex items-center justify-center text-6xl">
							📦
						</div>
						<h3 className="text-xl font-bold text-white mb-2">
							{crate.name}
						</h3>
						<p className="text-gray-400 text-sm mb-4 flex-1">
							{crate.description}
						</p>

						<div className="space-y-1 mb-4 text-xs font-mono text-gray-500">
							{Object.entries(crate.dropRates).map(
								([rarity, rate]) => {
									if (rate === 0) return null;
									const color = ItemGenerator.getRarityColor(
										rarity as any
									);
									// Capitalize
									const label =
										rarity.charAt(0) +
										rarity.slice(1).toLowerCase();
									return (
										<div
											key={rarity}
											className="flex justify-between"
										>
											<span style={{ color }}>
												{label}
											</span>
											<span>
												{(rate * 100).toFixed(0)}%
											</span>
										</div>
									);
								}
							)}
						</div>

						<button
							onClick={() => handleBuy(crate)}
							disabled={money < crate.price}
							className={`
                                w-full py-3 font-bold rounded pixel-text transition-colors
                                ${
									money >= crate.price
										? 'bg-green-600 hover:bg-green-500 text-white'
										: 'bg-gray-700 text-gray-400 cursor-not-allowed'
								}
                            `}
						>
							${crate.price.toLocaleString()}
						</button>
					</div>
				))}
			</div>
		</div>
	);
};
