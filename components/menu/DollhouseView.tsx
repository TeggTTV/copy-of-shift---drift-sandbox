import React from 'react';
import { InventoryItem, ModType } from '../../types';
import { ItemGenerator } from '../../utils/ItemGenerator';
import { useGame } from '../../contexts/GameContext';

// Coordinate map for component positions on a generic car silhouette (0-100%)
// Assuming a top-down or side view. Let's assume Side View for now as it's easier to place engine/exhaust/wheels.
// Or user specifically mentioned "Dollhouse" which often implies looking inside.
const PART_POSITIONS: Record<string, { x: number; y: number }> = {
	ENGINE: { x: 75, y: 50 }, // Front (assuming car faces right? or left?) Let's assume Front is Right (75%)
	TURBO: { x: 65, y: 40 },
	TRANSMISSION: { x: 50, y: 70 },
	TIRES: { x: 20, y: 80 }, // Rear Tire
	TIRES_FRONT: { x: 80, y: 80 }, // Front Tire (hacky dup? handle later)
	BRAKES: { x: 80, y: 80 }, // Front Brakes
	SUSPENSION: { x: 20, y: 65 },
	EXHAUST: { x: 10, y: 85 },
	INTERIOR: { x: 45, y: 45 },
	NITROUS: { x: 30, y: 50 }, // Trunk/Rear seats
	ECU: { x: 60, y: 45 }, // Dash
	COOLING: { x: 90, y: 55 }, // Radiator
};

// Map ModType to generic icons if item specific icon missing
const TYPE_ICONS: Record<string, string> = {
	ENGINE: '🔧',
	TURBO: '🐌',
	TRANSMISSION: '⚙️',
	TIRES: '🍩',
	WEIGHT: '⚖️',
	NITROUS: '🚀',
	FUEL: '⛽',
	COOLING: '❄️',
	AERO: '🌬️',
	SUSPENSION: '🔩',
	VISUAL: '🎨',
	PAINT: '🖌️',
	BRAKES: '🛑',
	INTERIOR: '💺',
	ELECTRONICS: '💻',
};

export const DollhouseView = () => {
	const { userInventory } = useGame();

	// Find equipped items
	const equippedItems = userInventory.filter((i) => i.equipped);

	// Group by type for easier lookup (some types might have multiple items? Logic says 1 per type for now)
	const equippedByType: Record<string, InventoryItem> = {};
	equippedItems.forEach((i) => {
		equippedByType[i.type] = i;
	});

	return (
		<div className="w-full h-64 bg-gray-900/50 mt-4 rounded-lg relative overflow-hidden border border-gray-700 flex items-center justify-center">
			{/* Background Grid/Schematic Look */}
			<div
				className="absolute inset-0 opacity-10"
				style={{
					backgroundImage:
						'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
					backgroundSize: '20px 20px',
				}}
			/>

			{/* Car Silhouette / Wireframe */}
			{/* Using a simple CSS shape or SVG for "Car" if no sprite available. 
                Using a generic car text/block for now or a very abstract shape. */}
			<div className="relative w-[300px] h-[100px] bg-gray-800/30 border-2 border-white/20 rounded-xl skew-x-[-20deg]">
				{/* Wheels */}
				<div className="absolute -bottom-4 left-4 w-12 h-12 bg-black rounded-full border border-gray-600 skew-x-[20deg]" />
				<div className="absolute -bottom-4 right-8 w-12 h-12 bg-black rounded-full border border-gray-600 skew-x-[20deg]" />
				{/* Cabin */}
				<div className="absolute top-[-40px] left-10 w-40 h-10 bg-gray-800/30 border-t-2 border-l-2 border-r-2 border-white/20 rounded-t-lg skew-x-[10deg]" />

				<div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
					<span className="font-bold text-4xl tracking-widest text-white">
						X-RAY
					</span>
				</div>
			</div>

			{/* Component Nodes */}
			{/* We map over PART_POSITIONS keys, check if item exists, render node */}
			<div className="absolute inset-0 pointer-events-none">
				{/* Center the container to match the car width approx? 
                    Hardcoded to center 300px width on screen? 
                    Better: Use percentages relative to the main container, but scale positions to center 'car'.
                    Let's just position absolute relative to container. */}
				<div className="relative w-full h-full max-w-lg mx-auto">
					{Object.entries(PART_POSITIONS).map(([type, pos]) => {
						const item = equippedByType[type];
						const isEquipped = !!item;

						return (
							<div
								key={type}
								className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group pointer-events-auto transition-all duration-300
                                    ${
										isEquipped
											? 'opacity-100 z-10 scale-110'
											: 'opacity-30 scale-90 grayscale'
									}
                                `}
								style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
							>
								{/* Icon Bubble */}
								<div
									className={`
                                    w-8 h-8 rounded-full flex items-center justify-center border-2 
                                    ${
										isEquipped
											? `border-[${ItemGenerator.getRarityColor(
													item.rarity
											  )}] bg-gray-900 shadow-[0_0_10px_rgba(255,255,255,0.3)]`
											: 'border-gray-600 bg-black/50'
									}
                                    transition-colors
                                `}
									style={{
										borderColor: isEquipped
											? ItemGenerator.getRarityColor(
													item.rarity
											  )
											: undefined,
									}}
								>
									<span className="text-sm filter drop-shadow-lg drop-shadow-black">
										{item?.icon || TYPE_ICONS[type] || '❓'}
									</span>
								</div>

								{/* Connector Line (Visual Flourish) */}
								{/* <div className="h-4 w-px bg-white/20 absolute top-full" /> */}

								{/* Tooltip on Hover */}
								<div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-white/20 px-2 py-1 rounded text-[10px] whitespace-nowrap pointer-events-none">
									<div
										className={`font-bold ${
											isEquipped ? '' : 'text-gray-500'
										}`}
										style={{
											color: isEquipped
												? ItemGenerator.getRarityColor(
														item.rarity
												  )
												: undefined,
										}}
									>
										{isEquipped
											? item.name
											: `Empty ${type}`}
									</div>
									{isEquipped && (
										<div className="text-gray-400 text-[8px]">
											{item.rarity}
										</div>
									)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
