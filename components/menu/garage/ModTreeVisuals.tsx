import React, { useState, useRef, useEffect } from 'react';
import { ModNode } from '../../../types';

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
	const containerRef = useRef<HTMLDivElement>(null);
	const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
	const isDraggingRef = useRef(false);
	const lastMousePos = useRef({ x: 0, y: 0 });
	const dragStartPos = useRef({ x: 0, y: 0 });

	// Constants for layout
	const gridSize = 180;
	const nodeWidth = 144; // w-36
	const nodeHeight = 100; // approx

	// Calculate bounds and center initially
	useEffect(() => {
		if (!containerRef.current || mods.length === 0) return;

		const xs = mods.map((m) => m.x);
		const ys = mods.map((m) => m.y);
		const minX = Math.min(...xs);
		const maxX = Math.max(...xs);
		const minY = Math.min(...ys);
		const maxY = Math.max(...ys);

		// Position top-left of the tree at top-left of screen with some padding
		const padding = 50;
		const initialScale = 0.8;

		setTransform({
			x: padding - minX * gridSize * initialScale,
			y: padding - minY * gridSize * initialScale,
			scale: initialScale,
		});
	}, []);

	const handleWheel = (e: React.WheelEvent) => {
		e.stopPropagation();
		if (!containerRef.current) return;

		const rect = containerRef.current.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		const scaleAmount = -e.deltaY * 0.001;
		const newScale = Math.min(
			Math.max(0.2, transform.scale + scaleAmount),
			3
		);

		// Calculate the point in world space that is currently under the mouse
		// world_point = (mouse_screen - translate) / scale
		const worldX = (mouseX - transform.x) / transform.scale;
		const worldY = (mouseY - transform.y) / transform.scale;

		// Calculate new translate to keep that world point under the mouse
		// new_translate = mouse_screen - world_point * new_scale
		const newX = mouseX - worldX * newScale;
		const newY = mouseY - worldY * newScale;

		setTransform({
			x: newX,
			y: newY,
			scale: newScale,
		});
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		isDraggingRef.current = false;
		lastMousePos.current = { x: e.clientX, y: e.clientY };
		dragStartPos.current = { x: e.clientX, y: e.clientY };
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (e.buttons !== 1) return; // Only drag with left button

		const dx = e.clientX - lastMousePos.current.x;
		const dy = e.clientY - lastMousePos.current.y;

		if (
			Math.abs(e.clientX - dragStartPos.current.x) > 5 ||
			Math.abs(e.clientY - dragStartPos.current.y) > 5
		) {
			isDraggingRef.current = true;
		}

		setTransform((prev) => ({
			...prev,
			x: prev.x + dx,
			y: prev.y + dy,
		}));

		lastMousePos.current = { x: e.clientX, y: e.clientY };
	};

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
		<div
			ref={containerRef}
			className="flex-1 h-full relative overflow-hidden bg-[#111] cursor-grab active:cursor-grabbing select-none"
			onWheel={handleWheel}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
		>
			{/* Grid Background */}
			<div
				className="absolute inset-0 pointer-events-none opacity-10"
				style={{
					backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
					backgroundSize: `${50 * transform.scale}px ${
						50 * transform.scale
					}px`,
					backgroundPosition: `${transform.x}px ${transform.y}px`,
				}}
			/>

			<div
				className="absolute origin-top-left will-change-transform"
				style={{
					transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
				}}
			>
				{/* Draw Lines */}
				<svg
					className="absolute overflow-visible pointer-events-none z-0"
					style={{
						left: 0,
						top: 0,
						width: 0,
						height: 0,
					}}
				>
					{mods.map((mod) => {
						if (!mod.parentId) return null;
						const parent = mods.find((m) => m.id === mod.parentId);
						if (!parent) return null;

						const x1 = parent.x * gridSize + 72;
						const y1 = parent.y * gridSize + 50;
						const x2 = mod.x * gridSize + 72;
						const y2 = mod.y * gridSize + 50;

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
								strokeWidth="4"
								opacity={isUnlocked ? 0.6 : 0.3}
							/>
						);
					})}
				</svg>

				{/* Draw Nodes */}
				{mods.map((mod) => {
					const isOwned = owned.includes(mod.id);
					const parentOwned =
						!mod.parentId || owned.includes(mod.parentId);
					const hasConflict = mod.conflictsWith.some(
						(cId) =>
							owned.includes(cId) && !disabledMods.includes(cId)
					);

					const left = mod.x * gridSize;
					const top = mod.y * gridSize;

					return (
						<div
							key={mod.id}
							className={`absolute w-36 p-3 rounded-lg border-2 cursor-pointer transition-colors z-10
								${
									isOwned
										? 'border-2 shadow-lg'
										: hasConflict
										? 'bg-red-900/20 border-red-900 opacity-50 grayscale cursor-not-allowed'
										: parentOwned
										? 'bg-black/90 hover:bg-gray-900'
										: 'bg-black/50 border-gray-800 opacity-30 cursor-not-allowed'
								}
							`}
							style={{
								left,
								top,
								borderColor:
									mod.rarity === 'EXOTIC'
										? '#fbbf24' // Gold
										: isOwned
										? getCategoryColor(mod.type)
										: undefined,
								backgroundColor: isOwned
									? `${getCategoryColor(mod.type)}20`
									: undefined,
								boxShadow:
									mod.rarity === 'EXOTIC'
										? '0 0 15px rgba(251, 191, 36, 0.5)' // Gold Glow
										: isOwned
										? `0 0 20px ${getCategoryColor(
												mod.type
										  )}20`
										: 'none',
								animation:
									mod.rarity === 'EXOTIC'
										? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
										: 'none',
							}}
							onClick={(e) => {
								if (isDraggingRef.current) return;
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
									backgroundColor: getCategoryColor(mod.type),
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

			{/* Controls Hint */}
			<div className="absolute bottom-4 right-4 text-gray-500 text-xs font-mono pointer-events-none bg-black/50 px-2 py-1 rounded">
				DRAG TO PAN • SCROLL TO ZOOM
			</div>
		</div>
	);
};
