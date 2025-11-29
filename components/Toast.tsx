import React, { useEffect, useState } from 'react';
import { ToastType } from '../types';

interface ToastProps {
	message: string;
	type: ToastType;
	index: number;
	total: number;
}

const ICON_MAP: Record<ToastType, { x: number; y: number }> = {
	ENGINE: { x: 0, y: 0 },
	TIRES: { x: 1, y: 0 },
	WEIGHT: { x: 2, y: 0 },
	TRANSMISSION: { x: 3, y: 0 },
	TURBO: { x: 0, y: 1 },
	NITROUS: { x: 1, y: 1 },
	FUEL: { x: 2, y: 1 },
	COOLING: { x: 3, y: 1 },
	AERO: { x: 0, y: 2 },
	SUSPENSION: { x: 1, y: 2 },
	MONEY: { x: 2, y: 2 },
	UNLOCK: { x: 3, y: 2 },
	PAINT: { x: 0, y: 3 },
	ECU: { x: 1, y: 3 },
	WARNING: { x: 2, y: 3 },
	INFO: { x: 3, y: 3 }, // Using Checkmark for Info/Success
	ERROR: { x: 2, y: 3 }, // Use Warning sign for Error
	SUCCESS: { x: 3, y: 3 }, // Use Checkmark for Success
};

export const Toast: React.FC<ToastProps> = ({
	message,
	type,
	index,
	total,
}) => {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		// Animate in
		requestAnimationFrame(() => setVisible(true));
	}, []);

	const reverseIndex = index; // 0 is oldest
	const offset = reverseIndex * 10; // pixels down
	const scale = 1 - reverseIndex * 0.05; // smaller as it goes back
	const opacity = 1 - reverseIndex * 0.2; // fade out as it goes back

	// Only show the first 3-4 visually to avoid clutter
	if (reverseIndex > 3) return null;

	const iconCoords = ICON_MAP[type] || ICON_MAP.INFO;

	return (
		<div
			className="absolute transition-all duration-500 ease-in-out origin-top w-max"
			style={{
				transform: `translateY(${offset}px) scale(${scale})`,
				opacity: visible ? opacity : 0,
				zIndex: 100 - reverseIndex,
				top: 0,
			}}
		>
			<div className="bg-black border border-white/20 text-white px-6 py-3 rounded-lg shadow-2xl font-bold tracking-wide text-sm uppercase flex items-center gap-4 justify-center">
				<div
					className="w-16 h-16 flex-shrink-0"
					style={{
						backgroundImage: 'url(/toast_icons.png)',
						backgroundSize: '256px 256px',
						backgroundPosition: `-${iconCoords.x * 64}px -${
							iconCoords.y * 64
						}px`,
						// imageRendering: '',
					}}
				/>
				<span>{message}</span>
			</div>
		</div>
	);
};
