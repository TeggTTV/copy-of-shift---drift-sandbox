import React from 'react';
import { ModNode } from '../../types';

export const ModTreeVisuals = ({
	mods,
	owned,
	money,
	onToggle,
	onHover,
	disabledMods,
	onToggleDisable,
}: {
	mods: ModNode[];
	owned: string[];
	money: number;
	onToggle: (m: ModNode) => void;
	onHover: (m: ModNode | null) => void;
	disabledMods: string[];
	onToggleDisable: (id: string) => void;
}) => {
	// Calculate canvas size based on nodes
	const gridSize = 160; // Increased from 120 for better spacing
	const offsetX = 150;
	const offsetY = 1000; // Increased to prevent top cutoff

	// Category colors
	const getCategoryColor = (type: string): string => {
		const colors: Record<string, string> = {
			ENGINE: '#ef4444',
			TURBO: '#f59e0b',
			TRANSMISSION: '#8b5cf6',
			WEIGHT: '#06b6d4',
			TIRES: '#10b981',
			NITROUS: '#ec4899',
			FUEL: '#f97316',
			COOLING: '#3b82f6',
			AERO: '#14b8a6',
			SUSPENSION: '#a855f7',
			VISUAL: '#6366f1',
		};
		return colors[type] || '#6b7280';
	};

	return (
		<div className="flex flex-col h-full relative">
			{/* Mod Tree Canvas */}
			<div
				className="flex-1 overflow-auto"
				style={{
					scrollbarWidth: 'none',
					msOverflowStyle: 'none',
					willChange: 'scroll-position',
				}}
			>
				<style>{`
					.flex-1.overflow-auto::-webkit-scrollbar {
						display: none;
					}
				`}</style>
				<div
					className="relative w-[2400px] h-[2200px]"
					style={{ contain: 'layout paint' }}
				>
					{/* Draw Lines */}
					<svg
						className="absolute inset-0 w-full h-full pointer-events-none z-0"
						style={{ contain: 'strict' }}
					>
						{mods.map((mod) => {
							if (!mod.parentId) return null;
							const parent = mods.find(
								(m) => m.id === mod.parentId
							);
							if (!parent) return null;

							const x1 = offsetX + parent.x * gridSize + 72; // Center of node width
							const y1 = offsetY + parent.y * gridSize + 50;
							const x2 = offsetX + mod.x * gridSize + 72;
							const y2 = offsetY + mod.y * gridSize + 50;

							const isUnlocked = owned.includes(parent.id);

							return (
								<line
									key={`${parent.id}-${mod.id}`}
									x1={x1}
									y1={y1}
									x2={x2}
									y2={y2}
									stroke={
										isUnlocked
											? getCategoryColor(mod.type)
											: '#333'
									}
									strokeWidth="2"
									opacity={isUnlocked ? 0.6 : 0.3}
								/>
							);
						})}
					</svg>

					{/* Draw Nodes */}
					{mods.map((mod) => {
						const isOwned = owned.includes(mod.id);
						// Parent must be owned to buy, OR it's a root node
						const parentOwned =
							!mod.parentId || owned.includes(mod.parentId);
						// Conflicts?
						const hasConflict = mod.conflictsWith.some(
							(cId) =>
								owned.includes(cId) &&
								!disabledMods.includes(cId)
						);

						const left = offsetX + mod.x * gridSize;
						const top = offsetY + mod.y * gridSize;

						return (
							<div
								key={mod.id}
								className={`absolute w-36 p-3 rounded-lg border-2 cursor-pointer transition-all z-10
									${
										isOwned
											? 'border-2 shadow-lg'
											: hasConflict
											? 'bg-red-900/20 border-red-900 opacity-50 grayscale cursor-not-allowed'
											: parentOwned
											? 'bg-black/80 hover:scale-105 hover:shadow-xl'
											: 'bg-black/50 border-gray-800 opacity-30 cursor-not-allowed'
									}
								`}
								style={{
									left,
									top,
									borderColor: isOwned
										? getCategoryColor(mod.type)
										: undefined,
									backgroundColor: isOwned
										? `${getCategoryColor(mod.type)}20`
										: undefined,
									contain: 'content',
								}}
								onClick={() => {
									if (hasConflict && !isOwned) return;
									if (!parentOwned) return;
									onToggle(mod);
								}}
								onMouseEnter={() => onHover(mod)}
								onMouseLeave={() => onHover(null)}
							>
								<div
									className="text-[9px] font-bold uppercase mb-1 px-1 py-0.5 rounded inline-block"
									style={{
										backgroundColor: getCategoryColor(
											mod.type
										),
										color: '#000',
									}}
								>
									{mod.type}
								</div>
								<div className="font-bold text-xs leading-tight mb-1 text-white">
									{mod.name}
								</div>
								<div className="text-[10px] text-gray-400 leading-tight mb-2">
									{mod.description}
								</div>

								{isOwned ? (
									<div className="flex gap-1 mt-2">
										<button
											onClick={(e) => {
												e.stopPropagation();
												onToggleDisable(mod.id);
											}}
											className={`flex-1 text-[10px] font-bold text-center rounded py-1 transition-colors ${
												disabledMods.includes(mod.id)
													? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
													: 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
											}`}
										>
											{disabledMods.includes(mod.id)
												? 'DISABLED'
												: 'ENABLED'}
										</button>
										<button
											onClick={(e) => {
												e.stopPropagation();
												onToggle(mod);
											}}
											className="px-2 bg-red-900/30 text-red-400 text-[10px] font-bold rounded hover:bg-red-900/50"
											title="Sell"
										>
											$
										</button>
									</div>
								) : (
									<div
										className={`${
											money >= mod.cost
												? 'text-white'
												: 'text-red-500'
										} font-mono text-xs text-center border-t border-gray-700 pt-1`}
									>
										${mod.cost}
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
