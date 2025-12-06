import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, ItemRarity, ModType } from '../../types';
import { ItemGenerator } from '../../utils/ItemGenerator';

interface InventoryProps {
	items: InventoryItem[];
	onEquip: (item: InventoryItem) => void;
	onSell: (item: InventoryItem) => void; // For Auction
	onDestroy: (item: InventoryItem) => void;
	money: number;
}

const getItemIcon = (type: ModType): string => {
	switch (type) {
		case 'ENGINE':
			return '🔧';
		case 'TURBO':
			return '🐌';
		case 'TRANSMISSION':
			return '⚙️';
		case 'TIRES':
			return '🍩';
		case 'WEIGHT':
			return '⚖️';
		case 'NITROUS':
			return '🚀';
		case 'FUEL':
			return '⛽';
		case 'COOLING':
			return '❄️';
		case 'AERO':
			return '🌬️';
		case 'SUSPENSION':
			return '🔩';
		case 'VISUAL':
			return '🎨';
		case 'PAINT':
			return '🖌️';
		default:
			return '📦';
	}
};

export const Inventory: React.FC<InventoryProps> = ({
	items,
	onEquip,
	onSell,
	onDestroy,
	money,
}) => {
	const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(
		null
	);
	const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
	const containerRef = useRef<HTMLDivElement>(null);

	// Grid Setup
	const ROWS = 4;
	const COLS = 6;
	const TOTAL_SLOTS = ROWS * COLS;

	// Fill slots with items (simple layout for now, could be persistent slots later)
	const slots = Array(TOTAL_SLOTS)
		.fill(null)
		.map((_, i) => items[i] || null);

	const handleItemClick = (item: InventoryItem) => {
		setSelectedItem(item === selectedItem ? null : item);
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		// Update relative to window or container? Fixed position is safer for tooltips escaping container
		setMousePos({ x: e.clientX, y: e.clientY });
	};

	return (
		<div
			ref={containerRef}
			onMouseMove={handleMouseMove}
			className="w-full h-full bg-gray-900/90 p-4 rounded-lg flex gap-4 relative"
		>
			{/* Inventory Grid */}
			<div className="flex-1">
				<h2 className="text-2xl font-bold text-white pixel-text mb-4">
					INVENTORY
				</h2>
				<div
					className="grid gap-2"
					style={{
						gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
					}}
				>
					{slots.map((item, index) => (
						<div
							key={index}
							className={`
                                relative aspect-square bg-gray-800 border-2 rounded cursor-pointer transition-all
                                hover:border-white group flex items-center justify-center
                                ${
									item
										? 'border-' +
										  ItemGenerator.getRarityColor(
												item.rarity
										  ).replace('#', '') // Tailwind specific (hacky if using hex, better use inline style)
										: 'border-gray-700'
								}
                                ${
									selectedItem === item && item
										? 'ring-2 ring-yellow-400 bg-gray-700'
										: ''
								}
                            `}
							style={{
								borderColor: item
									? ItemGenerator.getRarityColor(item.rarity)
									: undefined,
							}}
							onClick={() => item && handleItemClick(item)}
							onMouseEnter={() => item && setHoveredItem(item)}
							onMouseLeave={() => setHoveredItem(null)}
						>
							{item && (
								<div className="flex flex-col items-center justify-center p-1 pointer-events-none">
									<div className="text-3xl mb-1 filter drop-shadow-md transform group-hover:scale-110 transition-transform">
										{getItemIcon(item.type)}
									</div>
									<div className="absolute bottom-1 right-1 text-[8px] px-1 bg-black/50 rounded font-mono text-white">
										{item.condition}%
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Selected Item Actions Panel (Right Side) */}
			{selectedItem && (
				<div className="w-64 bg-black/50 p-4 border-l border-gray-700 flex flex-col animate-slide-in-right">
					<h3 className="text-gray-400 pixel-text text-sm mb-4">
						SELECTED ITEM
					</h3>
					{(() => {
						const target = selectedItem;
						const color = ItemGenerator.getRarityColor(
							target.rarity
						);
						return (
							<>
								<div
									className="text-xl font-bold pixel-text mb-1"
									style={{ color }}
								>
									{target.name}
								</div>
								<div
									className="text-xs font-bold uppercase mb-4"
									style={{ color }}
								>
									{target.rarity} {target.type}
								</div>

								<div className="flex flex-col gap-2 mt-auto">
									<button
										onClick={() => onEquip(selectedItem)}
										className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded pixel-text"
									>
										EQUIP
									</button>
									<button
										onClick={() => onSell(selectedItem)}
										className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded pixel-text"
									>
										AUCTION
									</button>
									<button
										onClick={() => onDestroy(selectedItem)}
										className="w-full py-2 bg-red-900/50 hover:bg-red-600 text-gray-300 hover:text-white font-bold rounded text-xs"
									>
										DESTROY
									</button>
								</div>
							</>
						);
					})()}
				</div>
			)}

			{/* Floating Tooltip */}
			{hoveredItem && !selectedItem && (
				<div
					className="fixed z-[100] w-64 bg-black/95 border-2 p-4 rounded shadow-2xl pointer-events-none animate-in fade-in duration-75"
					style={{
						left: mousePos.x + 15,
						top: mousePos.y + 15,
						borderColor: ItemGenerator.getRarityColor(
							hoveredItem.rarity
						),
					}}
				>
					<div
						className="text-lg font-bold pixel-text mb-1"
						style={{
							color: ItemGenerator.getRarityColor(
								hoveredItem.rarity
							),
						}}
					>
						{hoveredItem.name}
					</div>
					<div className="text-[10px] uppercase tracking-wider mb-2 text-gray-500">
						{hoveredItem.rarity} {hoveredItem.type}
					</div>
					<p className="text-xs text-gray-300 italic mb-3 leading-relaxed border-b border-gray-800 pb-2">
						{hoveredItem.description}
					</p>

					<div className="space-y-1">
						{Object.entries(hoveredItem.stats).map(([key, val]) => {
							if (typeof val === 'object') return null; // Skip complex stats like torqueCurve
							return (
								<div
									key={key}
									className="flex justify-between text-xs font-mono"
								>
									<span className="text-gray-400 capitalize">
										{key.replace(/([A-Z])/g, ' $1')}
									</span>
									<span className="text-cyan-400">
										{typeof val === 'number' && val > 0
											? '+'
											: ''}
										{val}
									</span>
								</div>
							);
						})}
					</div>
					<div className="mt-3 pt-2 border-t border-gray-800 flex justify-between text-xs font-mono">
						<span className="text-gray-500">Value</span>
						<span className="text-green-400">
							${hoveredItem.value.toLocaleString()}
						</span>
					</div>
				</div>
			)}
		</div>
	);
};
