import React, { useState, useEffect } from 'react';
import { useMusic } from '../../contexts/MusicContext';

interface SettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
	const music = useMusic();
	const [musicVolume, setMusicVolume] = useState(music.getVolume() * 100);
	const [isMusicMuted, setIsMusicMuted] = useState(false);

	useEffect(() => {
		// Load initial volume
		setMusicVolume(music.getVolume() * 100);
	}, [music]);

	const handleMusicVolumeChange = (value: number) => {
		setMusicVolume(value);
		music.setVolume(value / 100);
		if (value > 0 && isMusicMuted) {
			setIsMusicMuted(false);
			music.unmute();
		}
	};

	const toggleMusicMute = () => {
		music.toggleMute();
		setIsMusicMuted(!isMusicMuted);
	};

	if (!isOpen) return null;

	return (
		<div className="absolute inset-0 bg-black/80 flex items-center justify-center z-[100] font-pixel">
			<div className="pixel-panel bg-neutral-900 p-8 w-full max-w-md">
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-2xl text-white pixel-text">SETTINGS</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-white text-xl"
					>
						✕
					</button>
				</div>

				<div className="space-y-6">
					{/* Music Volume */}
					<div>
						<div className="flex justify-between items-center mb-2">
							<label className="text-sm text-gray-300">
								Music Volume
							</label>
							<div className="flex items-center gap-2">
								<span className="text-xs text-gray-400 w-12 text-right">
									{Math.round(musicVolume)}%
								</span>
								<button
									onClick={toggleMusicMute}
									className={`text-xs px-2 py-1 pixel-btn ${
										isMusicMuted
											? 'bg-red-900/50 border-red-700 text-red-400'
											: ''
									}`}
								>
									{isMusicMuted ? '🔇' : '🔊'}
								</button>
							</div>
						</div>
						<input
							type="range"
							min="0"
							max="100"
							value={musicVolume}
							onChange={(e) =>
								handleMusicVolumeChange(Number(e.target.value))
							}
							className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
							style={{
								background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${musicVolume}%, #374151 ${musicVolume}%, #374151 100%)`,
							}}
						/>
					</div>

					{/* Current Track Info */}
					<div className="border-t border-gray-700 pt-4">
						<div className="text-xs text-gray-500 mb-1">
							Currently Playing
						</div>
						<div className="text-sm text-indigo-400">
							{music.getCurrentTrack()?.toUpperCase() || 'NONE'}
						</div>
						<div className="text-[10px] text-gray-600 mt-1">
							{music.getIsPlaying() ? '▶ Playing' : '⏸ Paused'}
						</div>
					</div>

					{/* Music Info */}
					<div className="border-t border-gray-700 pt-4">
						<div className="text-[10px] text-gray-500 leading-relaxed">
							<p className="mb-2">
								🎵 To add custom music tracks, place MP3 files
								in:
							</p>
							<code className="bg-black/50 px-2 py-1 rounded text-green-400 block mb-2">
								public/music/
							</code>
							<p>
								See{' '}
								<span className="text-indigo-400">
									public/music/README.md
								</span>{' '}
								for details.
							</p>
						</div>
					</div>
				</div>

				<button
					onClick={onClose}
					className="w-full pixel-btn mt-6 py-3"
				>
					CLOSE
				</button>
			</div>
		</div>
	);
};

export default SettingsModal;
