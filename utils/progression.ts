export const calculateNextLevelXp = (level: number): number => {
	return Math.floor(100 * level ** 2);
};

export const calculateLevelProgress = (xp: number, level: number) => {
	return {
		current: xp,
		max: calculateNextLevelXp(level),
		percentage: Math.min(100, (xp / calculateNextLevelXp(level)) * 100),
	};
};
