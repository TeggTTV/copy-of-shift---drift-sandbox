import React, { useEffect, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import { ToastProvider } from './contexts/ToastContext';

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
			<div className="w-full h-screen">
				<GameCanvas key={`${windowSize.w}-${windowSize.h}`} />
			</div>
		</ToastProvider>
	);
};

export default App;
