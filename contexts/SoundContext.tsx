import React, { createContext, useContext } from 'react';

export type SoundType =
	| 'click'
	| 'hover'
	| 'confirm'
	| 'back'
	| 'error'
	| 'purchase';

interface SoundContextType {
	play: (type: SoundType) => void;
}

const SoundContext = createContext<SoundContextType>({ play: () => {} });

export const useSound = () => useContext(SoundContext);

export const SoundProvider = ({
	children,
	play,
}: {
	children: React.ReactNode;
	play: (t: SoundType) => void;
}) => (
	<SoundContext.Provider value={{ play }}>{children}</SoundContext.Provider>
);
