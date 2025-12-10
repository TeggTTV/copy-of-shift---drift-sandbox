import React, { useEffect, useState } from 'react';
import GameCanvas from './components/GameCanvas';
import { ToastProvider } from './contexts/ToastContext';
import { MusicProvider } from './contexts/MusicContext';
import { AuthProvider } from './contexts/AuthContext';
import { PartyProvider } from './contexts/PartyContext';
import { HostMenu } from './components/menu/social/HostMenu';

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
				<AuthProvider>
					<PartyProvider>
						<div className="w-full h-screen relative">
							<GameCanvas
								key={`${windowSize.w}-${windowSize.h}`}
							/>
							<HostMenu />
						</div>
					</PartyProvider>
				</AuthProvider>
			</MusicProvider>
		</ToastProvider>
	);
};

export default App;
