import React, { useState, useEffect } from 'react';
import { InventoryItem } from '@/types';
import { ItemGenerator } from '@/utils/ItemGenerator';

interface DailyPartsShopProps {
	items: InventoryItem[];
	money: number;
	onBuy: (item: InventoryItem) => void;
	onRefresh: () => void;
}

export const DailyPartsShop: React.FC<DailyPartsShopProps> = ({
	items,
	money,
	onBuy,
	onRefresh,
}) => {
	const [timeRemaining, setTimeRemaining] = useState('');

	useEffect(() => {
		const updateTimer = () => {
			const now = new Date();
			const tomorrow = new Date(now);
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(0, 0, 0, 0);
			const diff = tomorrow.getTime() - now.getTime();

			const hours = Math.floor(diff / (1000 * 60 * 60));
			const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((diff % (1000 * 60)) / 1000);

			setTimeRemaining(
				`${hours.toString().padStart(2, '0')}:${minutes
					.toString()
					.padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
			);
		};

		updateTimer();
		const interval = setInterval(updateTimer, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<div className="w-full h-full p-4 overflow-y-auto font-pixel text-white">
			<div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
				<div>
					<h2 className="text-3xl text-yellow-500 pixel-text tracking-widest mb-2">
						DAILY SPECIALS
					</h2>
					<p className="text-gray-400 text-xs">
						Rare and unique parts. Stock refreshes every 24h.
					</p>
				</div>
				<div className="text-right">
					<div className="text-[10px] text-gray-500 uppercase">
						Refresh In
					</div>
					<div className="text-xl font-mono text-yellow-400">
						{timeRemaining}
					</div>
				</div>
			</div>

			{items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 opacity-50">
					<div className="text-4xl mb-4">🔒</div>
					<div className="text-xl pixel-text">SOLD OUT</div>
					<div className="text-sm text-gray-400 mt-2">
						Check back tomorrow!
					</div>
					{/* Dev Refresh Button */}
					<button
						onClick={onRefresh}
						className="mt-8 opacity-20 hover:opacity-100 text-xs underline"
					>
						(Dev) Force Refresh
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{items.map((item) => (
						<div
							key={item.instanceId}
							className="relative bg-gray-900 border border-yellow-900/50 p-6 flex flex-col group hover:border-yellow-500 transition-all hover:translate-y-[-2px] hover:shadow-[0_0_20px_rgba(234,179,8,0.2)]"
						>
							{/* Special Badge */}
							<div className="absolute top-0 right-0 bg-yellow-600 text-black text-[10px] font-bold px-2 py-1 shadow-lg">
								LIMITED
							</div>

							{/* Glowing border effect */}
							<div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-500/20 pointer-events-none animate-pulse" />

							<div className="mb-4">
								<h3
									className="text-xl text-yellow-400 pixel-text truncate"
									title={item.name}
								>
									{item.name}
								</h3>
								<div className="text-xs text-yellow-500/50 uppercase font-mono mt-1">
									{item.rarity} {item.type}
								</div>
							</div>

							<div className="flex-1 space-y-2 mb-6">
								{Object.entries(item.stats).map(([k, v]) => {
									if (typeof v !== 'number') return null;
									return (
										<div
											key={k}
											className="flex justify-between items-center bg-black/40 px-2 py-1 rounded"
										>
											<span className="text-xs text-gray-500 capitalize">
												{k}
											</span>
											<span className="text-sm font-mono text-white">
												+{v}
											</span>
										</div>
									);
								})}
							</div>

							<div className="mt-auto">
								<div className="flex justify-between items-end mb-3">
									<span className="text-xs text-gray-500">
										Price
									</span>
									<span className="text-xl text-green-400 font-bold pixel-text">
										${item.value.toLocaleString()}
									</span>
								</div>
								<button
									onClick={() => onBuy(item)}
									disabled={money < item.value}
									className={`w-full py-3 pixel-text text-sm transition-colors ${
										money >= item.value
											? 'bg-yellow-700 hover:bg-yellow-600 text-white'
											: 'bg-gray-800 text-gray-500 cursor-not-allowed'
									}`}
								>
									{money >= item.value
										? 'PURCHASE'
										: 'NO FUNDS'}
								</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};
