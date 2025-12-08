import React, {
	createContext,
	useContext,
	useRef,
	useEffect,
	useMemo,
} from 'react';
import { MusicEngine, MusicTrack } from '../components/MusicEngine';

interface MusicContextType {
	play: (track: MusicTrack, fadeInDuration?: number) => void;
	stop: (fadeOutDuration?: number) => void;
	pause: () => void;
	resume: () => void;
	setVolume: (volume: number) => void;
	getVolume: () => number;
	mute: () => void;
	unmute: () => void;
	toggleMute: () => void;
	getCurrentTrack: () => MusicTrack | null;
	getIsPlaying: () => boolean;
}

const MusicContext = createContext<MusicContextType>({
	play: () => {},
	stop: () => {},
	pause: () => {},
	resume: () => {},
	setVolume: () => {},
	getVolume: () => 0.3,
	mute: () => {},
	unmute: () => {},
	toggleMute: () => {},
	getCurrentTrack: () => null,
	getIsPlaying: () => false,
});

export const useMusic = () => useContext(MusicContext);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const engineRef = useRef<MusicEngine>(new MusicEngine());
	const [isInitialized, setIsInitialized] = React.useState(false);

	useEffect(() => {
		const engine = engineRef.current;

		// Try to initialize immediately
		const initMusic = async () => {
			try {
				await engine.init();
				engine.loadSettings();
				// Preload all tracks
				await engine.loadAllTracks();
				setIsInitialized(true);
				// console.log('[MusicContext] Initialized successfully');
			} catch (error) {
				// console.warn(
				// 	'[MusicContext] Auto-init failed, waiting for user interaction:',
				// 	error
				// );
			}
		};

		// Attempt immediate initialization
		// initMusic(); // Removed to prevent AudioContext warning. Waits for interaction.

		// Fallback: Initialize on first interaction if auto-init failed
		const handleFirstInteraction = () => {
			if (!isInitialized) {
				initMusic();
			}
			window.removeEventListener('click', handleFirstInteraction);
			window.removeEventListener('keydown', handleFirstInteraction);
		};

		window.addEventListener('click', handleFirstInteraction);
		window.addEventListener('keydown', handleFirstInteraction);

		return () => {
			window.removeEventListener('click', handleFirstInteraction);
			window.removeEventListener('keydown', handleFirstInteraction);
		};
	}, []);

	const contextValue: MusicContextType = useMemo(
		() => ({
			play: (track, fadeInDuration) =>
				engineRef.current.play(track, fadeInDuration),
			stop: (fadeOutDuration) => engineRef.current.stop(fadeOutDuration),
			pause: () => engineRef.current.pause(),
			resume: () => engineRef.current.resume(),
			setVolume: (volume) => engineRef.current.setVolume(volume),
			getVolume: () => engineRef.current.getVolume(),
			mute: () => engineRef.current.mute(),
			unmute: () => engineRef.current.unmute(),
			toggleMute: () => engineRef.current.toggleMute(),
			getCurrentTrack: () => engineRef.current.getCurrentTrack(),
			getIsPlaying: () => engineRef.current.getIsPlaying(),
		}),
		[]
	);

	return (
		<MusicContext.Provider value={contextValue}>
			{children}
		</MusicContext.Provider>
	);
};
