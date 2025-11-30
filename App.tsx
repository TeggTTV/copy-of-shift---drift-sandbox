import React, { useEffect, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import { ToastProvider } from './contexts/ToastContext';
import { MusicProvider } from './contexts/MusicContext';

const App: React.FC = () => {
	const [windowSize, setWindowSize] = useState({
		w: window.innerWidth,
		h: window.innerHeight,
	});

	useEffect(() => {
		const handleResize = () => {
			setWindowSize({ w: window.innerWidth, h: window.innerHeight });
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return (
		<ToastProvider>
			<MusicProvider>
				<div className="w-full h-screen">
					<GameCanvas key={`${windowSize.w}-${windowSize.h}`} />
				</div>
			</MusicProvider>
		</ToastProvider>
	);
};

export default App;
