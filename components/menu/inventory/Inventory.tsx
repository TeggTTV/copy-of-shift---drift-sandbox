import React, { useState, useRef } from 'react';
import { InventoryItem } from '@/types';
import { ItemGenerator } from '@/utils/ItemGenerator';
import { ItemCard } from '@/components/ui/ItemCard';
import { ItemMerge } from '@/utils/ItemMerge';

interface InventoryProps {
	items: InventoryItem[]; // Uninstalled items
	installedItems: InventoryItem[]; // Installed on current car
	carName?: string;
	onEquip: (item: InventoryItem) => void; // Install
	onRemove: (item: InventoryItem) => void; // Uninstall
	onSell: (item: InventoryItem) => void; // For Auction
	onDestroy: (item: InventoryItem) => void;
	onRepair: (item: InventoryItem, cost: number) => void;
	onMerge: (item1: InventoryItem, item2: InventoryItem) => void;
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
	onRepair,
	onMerge,
	money,
}) => {
	const [mergeSourceItem, setMergeSourceItem] =
		useState<InventoryItem | null>(null);
	const [mergeTargetItem, setMergeTargetItem] =
		useState<InventoryItem | null>(null);

	const [contextMenu, setContextMenu] = useState<{
		item: InventoryItem;
		isInstalled: boolean;
		x: number;
		y: number;
	} | null>(null);

	const calculateRepairCost = (item: InventoryItem) => {
		if (!item.condition || item.condition >= 100) return 0;
		// Cost = Value * Damage * Multiplier
		// E.g. $1000 item at 50% condition (0.5 damage) = $1000 * 0.5 * 0.5 = $250 to fix?
		// Let's make it relatively cheap to encourage maintenance.
		const damage = 100 - item.condition;

		return Math.floor(item.value * damage * 0.2); // 20% of value to fully repair from 0
	};

	const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);
	const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
	const containerRef = useRef<HTMLDivElement>(null);

	const COLS = 8;
	const TOTAL_SLOTS = 64; // Fixed grid size for visual consistency

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
				{slots.map((item, index) => {
					const canMerge =
						mergeSourceItem &&
						item &&
						ItemMerge.canMerge(mergeSourceItem, item);
					const isDimmed =
						mergeSourceItem &&
						!canMerge &&
						item !== mergeSourceItem;
					const isMergeSource =
						mergeSourceItem && item && mergeSourceItem === item;

					return (
						<ItemCard
							key={index}
							item={item}
							onClick={(e) =>
								item && handleItemClick(e, item, isInstalled)
							}
							onMouseEnter={() => item && setHoveredItem(item)}
							onMouseLeave={() => setHoveredItem(null)}
							isSelected={
								contextMenu?.item === item || isMergeSource
							}
							showCondition={true}
							className={
								isDimmed
									? 'opacity-20 grayscale'
									: isMergeSource
									? 'ring-2 ring-yellow-500 animate-pulse'
									: ''
							}
						/>
					);
				})}
			</div>
		);
	};

	const handleItemClick = (
		e: React.MouseEvent,
		item: InventoryItem,
		isInstalled: boolean
	) => {
		e.stopPropagation();

		// Merge Logic
		if (mergeSourceItem) {
			if (item === mergeSourceItem) {
				// Clicked self, cancel? Or ignore?
				setMergeSourceItem(null);
				return;
			}
			if (ItemMerge.canMerge(mergeSourceItem, item) && !isInstalled) {
				// Valid target
				setMergeTargetItem(item);
			} else {
				// Invalid target
				// checking !isInstalled because prompt says "Only allow the player to merge parts in the inventory section"
				// Wait, can source be installed? "Only allow ... in the inventory section".
				// Implies both must be uninstalled.
				// I'll enforce !isInstalled for target.
				// Source selection is likely enforced via context menu availability.
			}
			return; // Don't match context menu if selecting for merge
		}

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

					{!contextMenu.isInstalled && (
						<button
							onClick={() => {
								setMergeSourceItem(contextMenu.item);
								setContextMenu(null);
							}}
							// Initial check if there are others? User prompt says "disabled if there are no others".
							// I'll leave enabled for simplicity or check:
							disabled={
								!items.some(
									(i) =>
										i !== contextMenu.item &&
										ItemMerge.canMerge(contextMenu.item, i)
								)
							}
							className={`text-left px-2 py-1.5 text-xs font-bold rounded flex items-center gap-2 ${
								!items.some(
									(i) =>
										i !== contextMenu.item &&
										ItemMerge.canMerge(contextMenu.item, i)
								)
									? 'text-gray-600 cursor-not-allowed'
									: 'hover:bg-purple-600 text-white'
							}`}
						>
							<span>🧬</span> MERGE
						</button>
					)}

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

					{/* Repair Button */}
					{contextMenu.item.condition !== undefined &&
						contextMenu.item.condition < 100 && (
							<button
								onClick={() => {
									const cost = calculateRepairCost(
										contextMenu.item
									);
									onRepair(contextMenu.item, cost);
									setContextMenu(null);
								}}
								disabled={
									money <
									calculateRepairCost(contextMenu.item)
								}
								className={`text-left px-2 py-1.5 text-xs font-bold rounded flex items-center justify-between gap-2 ${
									money >=
									calculateRepairCost(contextMenu.item)
										? 'hover:bg-green-600 text-white'
										: 'text-gray-500 cursor-not-allowed'
								}`}
							>
								<div className="flex items-center gap-2">
									<span>🔧</span> REPAIR
								</div>
								<span
									className={
										money >=
										calculateRepairCost(contextMenu.item)
											? 'text-green-300'
											: 'text-red-500'
									}
								>
									${calculateRepairCost(contextMenu.item)}
								</span>
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
					className="fixed z-[200] w-64 bg-black/95 border-2 p-4 rounded shadow-2xl pointer-events-none animate-in fade-in duration-75"
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
						{Object.entries(hoveredItem.stats).map(
							([key, val]: [string, any]) => {
								if (typeof val === 'object') return null;

								const degradableStats = [
									'maxTorque',
									'tireGrip',
									'brakingForce',
									'turboIntensity',
									'dragCoefficient',
								];
								const isDegradable =
									degradableStats.includes(key);
								const rawCondition =
									hoveredItem.condition ?? 100;
								const conditionFactor =
									rawCondition > 1
										? rawCondition / 100
										: rawCondition;

								let displayVal = val;
								let penaltyText = null;

								if (
									isDegradable &&
									conditionFactor < 1 &&
									typeof val === 'number'
								) {
									displayVal = val * conditionFactor;
									// Round logic: integer for large numbers, decimals for small
									if (Math.abs(displayVal) >= 10) {
										displayVal = Math.round(displayVal);
									} else {
										displayVal = parseFloat(
											displayVal.toFixed(2)
										);
									}

									const lostPercent = Math.round(
										(1 - conditionFactor) * 100
									);
									if (lostPercent > 0)
										penaltyText = `(-${lostPercent}%)`;
								}

								return (
									<div
										key={key}
										className="flex justify-between text-xs font-mono"
									>
										<span className="text-gray-400 capitalize">
											{key.replace(/([A-Z])/g, ' $1')}
										</span>
										<div className="flex gap-2">
											<span className="text-cyan-400">
												{typeof displayVal ===
													'number' && displayVal > 0
													? '+'
													: ''}
												{displayVal.toFixed(2)}
											</span>
											{penaltyText && (
												<span className="text-red-500">
													{penaltyText}
												</span>
											)}
										</div>
									</div>
								);
							}
						)}
					</div>
					<div className="mt-3 pt-2 border-t border-gray-800 flex justify-between text-xs font-mono">
						<span className="text-gray-500">Value</span>
						<span className="text-green-400">
							${hoveredItem.value.toLocaleString()}
						</span>
					</div>
				</div>
			)}
			{mergeTargetItem && mergeSourceItem && (
				<div
					className="absolute inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm"
					onClick={() => {
						setMergeTargetItem(null);
						setMergeSourceItem(null);
					}}
				>
					<div
						className="bg-gray-900 border-2 border-yellow-500 rounded p-6 shadow-2xl animate-in zoom-in-95 flex flex-col gap-4 min-w-[350px]"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="text-center">
							<h3 className="text-xl font-bold text-white mb-1 pixel-text">
								MERGE PARTS?
							</h3>
							<div className="text-gray-400 text-xs">
								Merge to create:
								<div className="flex flex-col gap-1 mt-1">
									{ItemMerge.getMergeProbabilities(
										mergeSourceItem.rarity,
										mergeTargetItem.rarity
									).map((p) => (
										<div
											key={p.rarity}
											className="flex items-center justify-center gap-2 text-xs"
										>
											<span
												style={{
													color: ItemGenerator.getRarityColor(
														p.rarity as any
													),
												}}
											>
												{p.rarity}
											</span>
											<span className="text-gray-400">
												{Math.round(p.chance * 100)}%
											</span>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className="flex items-center justify-center gap-4 bg-black/40 p-4 rounded-lg">
							<ItemCard
								item={mergeSourceItem}
								className="w-20 h-20"
								showCondition={true}
								onMouseEnter={() =>
									mergeSourceItem &&
									setHoveredItem(mergeSourceItem)
								}
								onMouseLeave={() => setHoveredItem(null)}
							/>
							<span className="text-2xl font-bold text-yellow-400">
								+
							</span>
							<ItemCard
								item={mergeTargetItem}
								className="w-20 h-20"
								showCondition={true}
								onMouseEnter={() =>
									mergeTargetItem &&
									setHoveredItem(mergeTargetItem)
								}
								onMouseLeave={() => setHoveredItem(null)}
							/>
						</div>

						<div className="text-xs text-gray-500 text-center italic">
							Warning: Both items will be consumed.
						</div>

						<div className="flex gap-2">
							<button
								onClick={() => {
									onMerge(mergeSourceItem, mergeTargetItem);
									setMergeTargetItem(null);
									setMergeSourceItem(null);
								}}
								className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded pixel-text"
							>
								MERGE
							</button>
							<button
								onClick={() => {
									setMergeTargetItem(null);
									setMergeSourceItem(null);
								}}
								className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded pixel-text"
							>
								CANCEL
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
