import React from 'react';
import { InventoryItem, ModType, ItemRarity } from '../../types';
import { ItemGenerator } from '../../utils/ItemGenerator';
import { GAME_ITEMS } from '../../data/GameItems';

interface ItemCardProps {
	item: InventoryItem | null;
	onClick?: () => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	isSelected?: boolean;
	showCondition?: boolean;
	className?: string;
}

// Particle count based on rarity
const getParticleCount = (rarity: ItemRarity): number => {
	switch (rarity) {
		case 'RARE':
			return 8;
		case 'EPIC':
			return 12;
		case 'LEGENDARY':
			return 16;
		default:
			return 0; // No particles for COMMON and UNCOMMON
	}
};

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

export const ItemCard: React.FC<ItemCardProps> = ({
	item,
	onClick,
	onMouseEnter,
	onMouseLeave,
	isSelected = false,
	showCondition = true,
	className = '',
}) => {
	// Lookup fresh sprite index from DB in case item is old
	const def = item ? GAME_ITEMS.find((g) => g.id === item.baseId) : null;
	const spriteIdx = def?.spriteIndex ?? item?.spriteIndex;

	const particleCount = item ? getParticleCount(item.rarity) : 0;
	const rarityColor = item
		? ItemGenerator.getRarityColor(item.rarity)
		: '#9ca3af';

	// Generate particle elements
	const particles =
		particleCount > 0
			? Array.from({ length: particleCount }, (_, i) => {
					const angle = (i / particleCount) * 360;
					const duration = 3 + (i % 3); // Vary between 3-5s
					const delay = (i / particleCount) * 2; // Stagger delays
					const size = 2 + (i % 3) * 0.5; // Vary size 2-3.5px
					return { angle, duration, delay, size };
			  })
			: [];

	return (
		<div
			onClick={onClick}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			className={`
				relative aspect-square bg-gray-800 border-2 rounded cursor-pointer transition-all
				hover:border-white group flex items-center justify-center
				${
					item
						? 'border-' +
						  ItemGenerator.getRarityColor(item.rarity).replace(
								'#',
								''
						  )
						: 'border-gray-700'
				}
				${isSelected ? 'ring-2 ring-yellow-400 bg-gray-700' : ''}
				${className}
			`}
			style={{
				borderColor: item
					? ItemGenerator.getRarityColor(item.rarity)
					: undefined,
			}}
		>
			{/* Particle effects for rare items */}
			{particles.map((p, i) => (
				<div
					key={i}
					className="absolute pointer-events-none"
					style={{
						top: '50%',
						left: '50%',
						width: `${p.size}px`,
						height: `${p.size}px`,
						marginLeft: `-${p.size / 2}px`,
						marginTop: `-${p.size / 2}px`,
						animation: `particle-orbit-${i} ${p.duration}s linear ${p.delay}s infinite`,
					}}
				>
					<style>{`
						@keyframes particle-orbit-${i} {
							0% {
								transform: rotate(${p.angle}deg) translateX(48px) rotate(-${p.angle}deg);
								opacity: 0;
							}
							5% {
								opacity: 1;
							}
							95% {
								opacity: 1;
							}
							100% {
								transform: rotate(${p.angle + 360}deg) translateX(48px) rotate(-${
						p.angle + 360
					}deg);
								opacity: 0;
							}
						}
					`}</style>
					<div
						className="w-full h-full rounded-full"
						style={{
							backgroundColor: rarityColor,
							boxShadow: `0 0 ${
								p.size * 2
							}px ${rarityColor}, 0 0 ${
								p.size * 3
							}px ${rarityColor}`,
						}}
					/>
				</div>
			))}

			{item && (
				<div className="flex flex-col items-center justify-center p-1 pointer-events-none w-full h-full relative z-10">
					{spriteIdx !== undefined ? (
						<div
							className="w-[80%] h-[80%] bg-no-repeat transition-transform group-hover:scale-110"
							style={{
								backgroundImage: `url(/icons/${
									spriteIdx >= 100
										? 'parts2.png'
										: 'parts.png'
								})`,
								backgroundSize: '500% 500%',
								backgroundPosition: `${
									((spriteIdx >= 100
										? spriteIdx - 100
										: spriteIdx) %
										5) *
									25
								}% ${
									Math.floor(
										(spriteIdx >= 100
											? spriteIdx - 100
											: spriteIdx) / 5
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
					{showCondition && (
						<div className="absolute bottom-1 right-1 text-[12px] px-1 bg-black/50 rounded font-mono text-white">
							{item.condition}%
						</div>
					)}
				</div>
			)}
		</div>
	);
};
