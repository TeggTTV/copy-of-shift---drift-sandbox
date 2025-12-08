import React, { useState, useRef } from 'react';
import { InventoryItem } from '@/types';
import { ItemGenerator } from '@/utils/ItemGenerator';
import { ItemCard } from '@/components/ui/ItemCard';

interface InventoryProps {
	items: InventoryItem[]; // Uninstalled items
	installedItems: InventoryItem[]; // Installed on current car
	carName?: string;
	onEquip: (item: InventoryItem) => void; // Install
	onRemove: (item: InventoryItem) => void; // Uninstall
	onSell: (item: InventoryItem) => void; // For Auction
	onDestroy: (item: InventoryItem) => void;
	money: number;
}

export const Inventory: React.FC<InventoryProps> = ({
	items,
	installedItems,
	carName,
	onEquip,
	onRemove,
	onSell,
	onDestroy,
	money,
}) => {
	const [contextMenu, setContextMenu] = useState<{
		item: InventoryItem;
		isInstalled: boolean;
		x: number;
		y: number;
	} | null>(null);
	const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
	const containerRef = useRef<HTMLDivElement>(null);

	const COLS = 6;
	const TOTAL_SLOTS = 24; // Fixed grid size for visual consistency

	// Helper to render a grid of items
	const renderGrid = (itemList: InventoryItem[], isInstalled: boolean) => {
		const displaySlots = Math.max(itemList.length, 12); // Minimum rows
		const slots = Array(displaySlots)
			.fill(null)
			.map((_, i) => itemList[i] || null);

		return (
			<div
				className="grid gap-2"
				style={{
					gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
				}}
			>
				{slots.map((item, index) => (
					<ItemCard
						key={index}
						item={item}
						onClick={(e) =>
							item && handleItemClick(e, item, isInstalled)
						}
						onMouseEnter={() => item && setHoveredItem(item)}
						onMouseLeave={() => setHoveredItem(null)}
						isSelected={contextMenu?.item === item}
						showCondition={true}
					/>
				))}
			</div>
		);
	};

	const handleItemClick = (
		e: React.MouseEvent,
		item: InventoryItem,
		isInstalled: boolean
	) => {
		e.stopPropagation();
		setContextMenu({ item, isInstalled, x: e.clientX, y: e.clientY });
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
			className="w-full h-full flex flex-col gap-2"
		>
			{/* Top Panel: Inventory */}
			<div className="flex-1 bg-gray-900/90 p-4 rounded-lg relative flex flex-col overflow-hidden">
				<h2 className="text-xl font-bold text-white pixel-text mb-2 flex justify-between items-center bg-black/40 p-2 rounded">
					<span>INVENTORY</span>
					<span className="text-xs text-gray-500 font-sans tracking-normal">
						{items.length} parts
					</span>
				</h2>
				<div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pr-2">
					{renderGrid(items, false)}
				</div>
			</div>

			{/* Bottom Panel: Installed Mods */}
			<div className="h-1/3 bg-gray-900/90 p-4 rounded-lg relative flex flex-col overflow-hidden border-t-2 border-indigo-900/50">
				<h2 className="text-lg font-bold text-indigo-400 pixel-text mb-2 flex justify-between items-center bg-indigo-900/20 p-2 rounded">
					<span>
						INSTALLED ON {carName ? carName.toUpperCase() : 'CAR'}
					</span>
					<span className="text-xs text-indigo-300 font-sans tracking-normal">
						{installedItems.length} parts
					</span>
				</h2>
				<div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pr-2">
					{renderGrid(installedItems, true)}
				</div>
			</div>

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

					{contextMenu.isInstalled ? (
						<button
							onClick={() => {
								onRemove(contextMenu.item);
								setContextMenu(null);
							}}
							className="text-left px-2 py-1.5 hover:bg-orange-600 text-white text-xs font-bold rounded flex items-center gap-2"
						>
							<span>⬇️</span> REMOVE
						</button>
					) : (
						<button
							onClick={() => {
								onEquip(contextMenu.item);
								setContextMenu(null);
							}}
							className="text-left px-2 py-1.5 hover:bg-blue-600 text-white text-xs font-bold rounded flex items-center gap-2"
						>
							<span>⬆️</span> INSTALL
						</button>
					)}

					{!contextMenu.isInstalled && (
						<button
							onClick={() => {
								onSell(contextMenu.item);
								setContextMenu(null);
							}}
							className="text-left px-2 py-1.5 hover:bg-yellow-600 text-white text-xs font-bold rounded flex items-center gap-2"
						>
							<span>💰</span> AUCTION
						</button>
					)}
					{!contextMenu.isInstalled && (
						<button
							onClick={() => {
								onDestroy(contextMenu.item);
								setContextMenu(null);
							}}
							className="text-left px-2 py-1.5 hover:bg-red-900 text-red-200 hover:text-white text-xs font-bold rounded flex items-center gap-2"
						>
							<span>🗑️</span> DESTROY
						</button>
					)}
				</div>
			)}

			{hoveredItem && !contextMenu && (
				<div
					className="fixed z-[100] w-64 bg-black/95 border-2 p-4 rounded shadow-2xl pointer-events-none animate-in fade-in duration-75"
					style={{
						left:
							mousePos.x + 280 > window.innerWidth
								? mousePos.x - 270
								: mousePos.x + 15,
						top:
							mousePos.y + 400 > window.innerHeight
								? undefined
								: mousePos.y + 15,
						bottom:
							mousePos.y + 400 > window.innerHeight
								? window.innerHeight - mousePos.y + 15
								: undefined,
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
						{hoveredItem.rarity} {hoveredItem.type} Part
					</div>

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
