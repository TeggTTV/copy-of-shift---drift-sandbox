import React, { useState, useRef } from 'react';
import { InventoryItem, ModType } from '../../types';
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
	const [contextMenu, setContextMenu] = useState<{
		item: InventoryItem;
		x: number;
		y: number;
	} | null>(null);
	const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
	const containerRef = useRef<HTMLDivElement>(null);

	const CATEGORIES = [
		{ name: 'All', icon: '🔍' },
		{ name: 'Engine', icon: '🔧' },
		{ name: 'Drivetrain', icon: '⚙️' },
		{ name: 'Suspension', icon: '🔩' },
		{ name: 'Exterior', icon: '🎨' },
		{ name: 'Interior', icon: '💺' },
		{ name: 'Electronics', icon: '💻' },
	];

	const ROWS = 4;
	const COLS = 6;
	const TOTAL_SLOTS = ROWS * COLS;

	const filteredItems = items;

	// Ensure we have at least TOTAL_SLOTS, but grow if more items
	const displaySlots = Math.max(filteredItems.length, TOTAL_SLOTS);
	const slots = Array(displaySlots)
		.fill(null)
		.map((_, i) => filteredItems[i] || null);

	const handleItemClick = (e: React.MouseEvent, item: InventoryItem) => {
		e.stopPropagation();
		setContextMenu({ item, x: e.clientX, y: e.clientY });
	};

	const handleBackgroundClick = () => {
		setContextMenu(null);
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		setMousePos({ x: e.clientX, y: e.clientY });
	};

	return (
		<div
			ref={containerRef}
			onMouseMove={handleMouseMove}
			onClick={handleBackgroundClick}
			className="w-full h-full bg-gray-900/90 p-4 rounded-lg relative flex flex-col"
		>
			<h2 className="text-2xl font-bold text-white pixel-text mb-4 flex justify-between items-center">
				<span>INVENTORY</span>
				<span className="text-xs text-gray-500 font-sans tracking-normal">
					{filteredItems.length} items
				</span>
			</h2>

			<div className="flex-1 overflow-y-auto mb-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
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
										  ).replace('#', '')
										: 'border-gray-700'
								}
                                ${
									contextMenu?.item === item
										? 'ring-2 ring-yellow-400 bg-gray-700'
										: ''
								}
                                ${
									item?.equipped
										? 'bg-green-900/30 ring-1 ring-green-500'
										: ''
								}
                            `}
							style={{
								borderColor: item
									? ItemGenerator.getRarityColor(item.rarity)
									: undefined,
							}}
							onClick={(e) => item && handleItemClick(e, item)}
							onMouseEnter={() => item && setHoveredItem(item)}
							onMouseLeave={() => setHoveredItem(null)}
						>
							{item && (
								<div className="flex flex-col items-center justify-center p-1 pointer-events-none w-full h-full">
									{item.spriteIndex !== undefined ? (
										<div
											className="w-[80%] h-[80%] bg-no-repeat transition-transform group-hover:scale-110"
											style={{
												backgroundImage:
													'url(/icons/parts.png)',
												backgroundSize: '500% 500%',
												backgroundPosition: `${
													(item.spriteIndex % 5) * 25
												}% ${
													Math.floor(
														item.spriteIndex / 5
													) * 25
												}%`,
												imageRendering: 'pixelated',
											}}
										/>
									) : (
										<div className="text-3xl mb-1 filter drop-shadow-md transform group-hover:scale-110 transition-transform">
											{getItemIcon(item.type)}
										</div>
									)}
									<div className="absolute bottom-1 right-1 text-[8px] px-1 bg-black/50 rounded font-mono text-white">
										{item.condition}%
									</div>
									{item.equipped && (
										<div className="absolute top-1 left-1 text-[10px] bg-green-500 text-black px-1 rounded font-bold">
											EQP
										</div>
									)}
								</div>
							)}
						</div>
					))}
				</div>
			</div>

			{/* <div className="mt-auto border-t border-gray-700 pt-4">
				<div className="flex gap-2 justify-center overflow-x-auto pb-2 scrollbar-hide">
					{CATEGORIES.map((cat) => (
						<div
							key={cat.name}
							className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded text-xl text-gray-400 select-none shadow-sm border border-gray-700"
							title={cat.name}
						>
							{cat.icon}
						</div>
					))}
				</div>
			</div> */}

			{contextMenu && (
				<div
					className="fixed z-[110] flex flex-col gap-1 p-1 bg-black/90 border border-gray-500 rounded shadow-xl animate-in fade-in zoom-in-95 duration-100"
					style={{
						left: Math.min(contextMenu.x, window.innerWidth - 180),
						top: Math.min(contextMenu.y, window.innerHeight - 150),
						minWidth: '140px',
					}}
					onClick={(e) => e.stopPropagation()}
				>
					<div
						className="px-2 py-1 text-xs font-bold uppercase border-b border-gray-700 mb-1"
						style={{
							color: ItemGenerator.getRarityColor(
								contextMenu.item.rarity
							),
						}}
					>
						{contextMenu.item.name}
					</div>
					{contextMenu.item.equipped ? (
						<div className="px-2 py-1.5 text-green-500 text-xs font-bold flex items-center gap-2 border-b border-gray-800 bg-green-900/20">
							<span>✅</span> EQUIPPED
						</div>
					) : (
						<button
							onClick={() => {
								onEquip(contextMenu.item);
								setContextMenu(null);
							}}
							className="text-left px-2 py-1.5 hover:bg-blue-600 text-white text-xs font-bold rounded flex items-center gap-2"
						>
							<span>🔧</span> EQUIP
						</button>
					)}

					<button
						onClick={() => {
							onSell(contextMenu.item);
							setContextMenu(null);
						}}
						className="text-left px-2 py-1.5 hover:bg-yellow-600 text-white text-xs font-bold rounded flex items-center gap-2"
					>
						<span>💰</span> AUCTION
					</button>
					<button
						onClick={() => {
							onDestroy(contextMenu.item);
							setContextMenu(null);
						}}
						className="text-left px-2 py-1.5 hover:bg-red-900 text-red-200 hover:text-white text-xs font-bold rounded flex items-center gap-2"
					>
						<span>🗑️</span> DESTROY
					</button>
				</div>
			)}

			{hoveredItem && !contextMenu && (
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
					{hoveredItem.equipped && (
						<div className="text-green-400 text-xs font-bold mb-2">
							[ EQUIPPED ]
						</div>
					)}
					<p className="text-xs text-gray-300 italic mb-3 leading-relaxed border-b border-gray-800 pb-2">
						{hoveredItem.description}
					</p>

					<div className="space-y-1">
						{Object.entries(hoveredItem.stats).map(([key, val]) => {
							if (typeof val === 'object') return null;
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
