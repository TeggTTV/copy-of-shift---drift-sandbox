import React, { useState, useEffect } from 'react';
import { calculateLevelProgress } from '@/utils/progression';
import { LevelBadge } from './LevelBadge';
import { FriendsSidepanel } from '../social/FriendsSidepanel';
import { PartyInviteOverlay } from '../social/PartyInviteOverlay';
import { useAuth } from '../../../contexts/AuthContext';
import { LoginModal } from '../../auth/LoginModal';

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

	const { isOnline } = useAuth();
	const [isFriendsOpen, setIsFriendsOpen] = useState(false);
	const [isLoginOpen, setIsLoginOpen] = useState(false);

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
				// Trigger money animation logic
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
			if (!isLevelingUp) {
				setDisplayXp(xp);
			}

			const gain = xp - prevXpRef.current;

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
		<div className="sticky top-0 left-0 right-0 h-16 bg-gray-900 border-b-4 border-gray-800 grid grid-cols-[1fr_2fr_1fr] items-center px-4 z-[100] shadow-xl">
			<FriendsSidepanel
				isOpen={isFriendsOpen}
				onClose={() => setIsFriendsOpen(false)}
			/>
			<PartyInviteOverlay friendsPanelOpen={isFriendsOpen} />
			<LoginModal
				isOpen={isLoginOpen}
				onClose={() => setIsLoginOpen(false)}
			/>

			{/* Left: Back Button */}
			<div className="flex items-center gap-4">
				{onBack && (
					<button
						onClick={onBack}
						className="text-gray-400 hover:text-white text-xs pixel-text"
					>
						&lt; BACK
					</button>
				)}
			</div>

			{/* Center: XP Bar & Level */}
			<div className="flex items-center justify-center max-w-2xl mx-auto w-full gap-3 relative">
				<div className="relative shrink-0">
					<LevelBadge level={displayLevel} />
				</div>
				<div className="flex-1 flex flex-col justify-center">
					<div className="flex justify-between text-[10px] text-gray-400 mb-1 font-pixel">
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
			</div>

			{/* Right: Money & Title */}
			<div className="flex items-center justify-end relative">
				<div className="flex items-center">
					<span className="text-green-400 text-xl font-bold pixel-text mr-1">
						$
					</span>
					<span className="font-pixel text-white">
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

				{/* Friends Icon or Login */}
				{isOnline ? (
					<button
						onClick={() => setIsFriendsOpen(!isFriendsOpen)}
						className="ml-4 text-white hover:text-cyan-400 transition-colors"
						title="Friends List"
					>
						{/* Pixel Art Friend Icon (Simple Group) */}
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="currentColor"
							className="pixel-antialiased"
						>
							<path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
						</svg>
					</button>
				) : (
					<button
						onClick={() => setIsLoginOpen(true)}
						className="ml-4 pixel-btn text-[10px] py-1 px-2 bg-blue-700 text-white border-blue-900"
					>
						LOGIN
					</button>
				)}
			</div>
		</div>
	);
};
