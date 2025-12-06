import React, { useState, useEffect } from 'react';
import { calculateLevelProgress } from '../../utils/progression';
import { LevelBadge } from './LevelBadge';

export const TopBar = ({
	level,
	xp,
	money,
	onBack,
	title,
	initialXp,
	initialMoney,
}: {
	level: number;
	xp: number;
	money: number;
	onBack?: () => void;
	title?: string;
	initialXp?: number;
	initialMoney?: number;
}) => {
	// --- State for Animations ---
	// Initialize with initial values if provided, otherwise current values
	const [displayLevel, setDisplayLevel] = useState(level);
	const [displayXp, setDisplayXp] = useState(initialXp ?? xp);
	const [displayMoney, setDisplayMoney] = useState(initialMoney ?? money);
	const [isLevelingUp, setIsLevelingUp] = useState(false);

	// Floating Text State
	const [xpGains, setXpGains] = useState<
		{ id: number; amount: number; key: number }[]
	>([]);
	const [moneyGains, setMoneyGains] = useState<
		{ id: number; amount: number; key: number }[]
	>([]);

	// Refs for previous values to detect changes
	// Initialize refs with the starting display values
	const prevLevelRef = React.useRef(level);
	const prevXpRef = React.useRef(initialXp ?? xp);
	const prevMoneyRef = React.useRef(initialMoney ?? money);

	// Effect to trigger animation from initial values to current values on mount
	useEffect(() => {
		if (initialXp !== undefined && initialXp !== xp) {
			// Small delay to ensure render happens first
			setTimeout(() => {
				setDisplayXp(xp);
				const gain = xp - initialXp;
				if (gain > 0) {
					const newGain = {
						id: Date.now(),
						amount: gain,
						key: Math.random(),
					};
					setXpGains((prev) => [...prev, newGain]);
					setTimeout(() => {
						setXpGains((prev) =>
							prev.filter((g) => g.id !== newGain.id)
						);
					}, 1500);
				}
			}, 2000); // 2000ms delay before animating
		}
	}, [initialXp, xp]);

	useEffect(() => {
		if (initialMoney !== undefined && initialMoney !== money) {
			setTimeout(() => {
				// Trigger money animation logic (handled by the main money effect below if we update state, but here we need to force it)
				// Actually, the main effect watches `money` prop.
				// But since we initialized `displayMoney` to `initialMoney`, we just need to update `displayMoney` to `money` smoothly.
				// The main effect compares `money` prop to `prevMoneyRef`.
				// `prevMoneyRef` is `initialMoney`. `money` is `money`. They differ.
				// So the main effect SHOULD fire.
				// However, the main effect runs on every render.
				// Let's rely on the main effect, but we need to ensure `prevMoneyRef` is set correctly.
				// It is set to `initialMoney`.
			}, 2000);
		}
	}, [initialMoney, money]);

	// --- XP and Level Logic ---
	useEffect(() => {
		// Level Up Detected
		if (level > prevLevelRef.current) {
			setIsLevelingUp(true);

			// 1. Fill bar to max (using PREVIOUS level's max)
			const { max: prevMax } = calculateLevelProgress(
				0,
				prevLevelRef.current
			); // XP doesn't matter for max
			setDisplayXp(prevMax);

			// 2. Wait for bar to fill, then change level number
			setTimeout(() => {
				setDisplayLevel(level);

				// 3. Reset bar to new XP (0 or overflow)
				setTimeout(() => {
					setIsLevelingUp(false);
					setDisplayXp(xp);
				}, 600); // Wait for level slide animation
			}, 500); // Wait for bar fill animation
		} else if (xp !== prevXpRef.current) {
			// Normal XP Gain
			// If we are animating from initialXp, we handled the gain text in the mount effect.
			// But we need to update displayXp.
			// If this is a subsequent update (not the initial one), we handle it here.
			// If it IS the initial update (triggered by the timeout above setting displayXp?), wait.
			// Actually, `setDisplayXp` triggers re-render.
			// We need to differentiate between "prop update" and "internal animation".

			// Simplified: Just watch props.
			if (!isLevelingUp) {
				setDisplayXp(xp);
			}

			// Add Floating Text (only if not handled by initial mount logic)
			// If initialXp was provided, we handled it there.
			// We can check if `prevXpRef.current` matches `initialXp` and we are just mounting?
			// No, simpler: Just check if we already added a gain for this?
			// Or just let this logic handle it if we update `prevXpRef` correctly.

			const gain = xp - prevXpRef.current;
			// Only show gain if it's a new update, NOT if it's the initial animation which we might have handled manually?
			// Actually, if we use the timeout to setDisplayXp, that doesn't change props.
			// This effect runs when `xp` PROP changes.
			// If `xp` prop is constant (e.g. on result screen), this effect runs once.
			// If `prevXpRef` was initialized to `initialXp`, then `xp !== prevXpRef` is true.
			// So this block runs.
			// So we don't need the separate `useEffect` for `initialXp` to trigger text?
			// We DO need the delay though.

			if (gain > 0) {
				// If we have a delay, we want to delay this text too.
				const delay = initialXp !== undefined ? 2000 : 0;
				setTimeout(() => {
					const newGain = {
						id: Date.now(),
						amount: gain,
						key: Math.random(),
					};
					setXpGains((prev) => [...prev, newGain]);
					setTimeout(() => {
						setXpGains((prev) =>
							prev.filter((g) => g.id !== newGain.id)
						);
					}, 1500);
				}, delay);
			}
		}

		prevLevelRef.current = level;
		prevXpRef.current = xp;
	}, [level, xp, isLevelingUp, initialXp]);

	// --- Money Logic ---
	useEffect(() => {
		if (money !== prevMoneyRef.current) {
			const diff = money - prevMoneyRef.current;
			const delay = initialMoney !== undefined ? 2000 : 0;

			setTimeout(() => {
				// Animate Counter
				const start = prevMoneyRef.current;
				const end = money;
				const duration = 1000;
				const startTime = performance.now();

				const animateMoney = (currentTime: number) => {
					const elapsed = currentTime - startTime;
					const progress = Math.min(elapsed / duration, 1);
					const ease = 1 - Math.pow(1 - progress, 4);

					const current = Math.floor(start + (end - start) * ease);
					setDisplayMoney(current);

					if (progress < 1) {
						requestAnimationFrame(animateMoney);
					}
				};
				requestAnimationFrame(animateMoney);

				// Add Floating Text
				if (diff !== 0) {
					const newGain = {
						id: Date.now(),
						amount: diff,
						key: Math.random(),
					};
					setMoneyGains((prev) => [...prev, newGain]);
					setTimeout(() => {
						setMoneyGains((prev) =>
							prev.filter((g) => g.id !== newGain.id)
						);
					}, 1500);
				}
			}, delay);
		}
		prevMoneyRef.current = money;
	}, [money, initialMoney]);

	// Calculate Progress based on DISPLAY values
	const { current, max, percentage } = calculateLevelProgress(
		displayXp,
		displayLevel
	);

	return (
		<div className="sticky top-0 left-0 right-0 h-16 bg-gray-900 border-b-4 border-gray-800 flex items-center px-4 z-[100] shadow-xl">
			{onBack && (
				<button
					onClick={onBack}
					className="mr-4 text-gray-400 hover:text-white text-xs pixel-text"
				>
					&lt; BACK
				</button>
			)}

			{/* Level Badge */}
			<div className="relative">
				<LevelBadge level={displayLevel} />
				{/* Level Up Animation Overlay (Optional, could be part of LevelBadge) */}
			</div>

			{/* XP Bar Container */}
			<div className="flex-1 flex flex-col justify-center mr-6 relative">
				<div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono">
					<span>XP</span>
					<span>
						{Math.floor(current)} / {max}
					</span>
				</div>
				<div className="h-3 bg-gray-800 border-2 border-gray-700 relative overflow-hidden skew-x-[-10deg]">
					{/* Fill */}
					<div
						className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500 ease-out relative"
						style={{ width: `${percentage}%` }}
					>
						{/* Shine effect */}
						<div className="absolute inset-0 bg-white/20"></div>
					</div>
					{/* Grid lines */}
					<div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
						{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
							<div
								key={i}
								className="w-[1px] h-full bg-black/20"
							></div>
						))}
					</div>
				</div>

				{/* Floating XP Text */}
				<div className="absolute top-8 left-0 pointer-events-none">
					{xpGains.map((gain) => (
						<div
							key={gain.key}
							className="absolute left-0 top-0 text-cyan-400 font-bold pixel-text text-sm animate-float-fade-up"
							style={{ textShadow: '1px 1px 0 #000' }}
						>
							+{gain.amount} XP
						</div>
					))}
				</div>
			</div>

			{/* Title (Optional) */}
			{title && (
				<div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl text-white pixel-text opacity-50">
					{title}
				</div>
			)}

			{/* Money Display */}
			<div className="flex items-center ml-auto relative">
				<span className="text-green-400 text-xl font-bold pixel-text mr-1">
					$
				</span>
				<span className="text-white text-xl font-mono">
					{displayMoney.toLocaleString()}
				</span>

				{/* Floating Money Text */}
				<div className="absolute top-8 right-0 pointer-events-none">
					{moneyGains.map((gain) => (
						<div
							key={gain.key}
							className={`absolute right-0 top-0 font-bold pixel-text text-sm animate-float-fade-up ${
								gain.amount >= 0
									? 'text-green-400'
									: 'text-red-400'
							}`}
							style={{ textShadow: '1px 1px 0 #000' }}
						>
							{gain.amount >= 0 ? '+' : ''}
							{gain.amount.toLocaleString()}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
