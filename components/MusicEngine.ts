export type MusicTrack = 'menu' | 'race' | 'victory' | 'defeat' | 'ambient';

interface TrackConfig {
	urls: string[]; // Multiple URLs for variety
	loop: boolean;
	volume?: number;
}

export class MusicEngine {
	private ctx: AudioContext | null = null;
	private masterGain: GainNode | null = null;
	private musicVolume: number = 0.05; // Default music volume (lower than SFX)
	private isInitialized = false;
	private isMuted = false;

	// Track management - now supports multiple files per category
	private tracks: Map<string, AudioBuffer> = new Map(); // Key: "menu-0", "menu-1", etc.
	private currentSource: AudioBufferSourceNode | null = null;
	private currentGain: GainNode | null = null;
	private currentTrack: MusicTrack | null = null;
	private currentTrackIndex: number = 0;
	private isPlaying = false;

	// Crossfade management
	private fadingOutSource: AudioBufferSourceNode | null = null;
	private fadingOutGain: GainNode | null = null;

	private trackConfigs: Map<MusicTrack, TrackConfig> = new Map([
		[
			'menu',
			{
				urls: [
					'/music/menu.mp3',
					'/music/menu1.mp3',
					'/music/menu2.mp3',
					'/music/menu3.mp3',
				],
				loop: true,
				volume: 1.0,
			},
		],
		[
			'race',
			{
				urls: [
					'/music/race.mp3',
					'/music/race1.mp3',
					'/music/race2.mp3',
					'/music/race3.mp3',
				],
				loop: true,
				volume: 1.0,
			},
		],
		[
			'victory',
			{
				urls: ['/music/victory.mp3', '/music/victory1.mp3'],
				loop: false,
				volume: 1.0,
			},
		],
		[
			'defeat',
			{
				urls: ['/music/defeat.mp3', '/music/defeat1.mp3'],
				loop: false,
				volume: 0.8,
			},
		],
		[
			'ambient',
			{
				urls: ['/music/ambient.mp3', '/music/ambient1.mp3'],
				loop: true,
				volume: 0.6,
			},
		],
	]);

	constructor() {}

	async init() {
		if (this.isInitialized) return;

		const AudioContext =
			window.AudioContext || (window as any).webkitAudioContext;
		this.ctx = new AudioContext();

		// Master gain for music
		this.masterGain = this.ctx.createGain();
		this.masterGain.gain.value = this.musicVolume; // Use musicVolume, not 0
		this.masterGain.connect(this.ctx.destination);

		this.isInitialized = true;

		// Resume context if suspended
		if (this.ctx.state === 'suspended') {
			await this.ctx.resume();
		}

		// 	console.log('[MusicEngine] Initialized');
	}

	async loadTrack(track: MusicTrack): Promise<void> {
		if (!this.ctx) {
			// console.error('[MusicEngine] Context not initialized');
			return;
		}

		const config = this.trackConfigs.get(track);
		if (!config) {
			// console.error(`[MusicEngine] No config for track: ${track}`);
			return;
		}

		// Load all URL variants for this track
		for (let i = 0; i < config.urls.length; i++) {
			const url = config.urls[i];
			const key = `${track}-${i}`;

			try {
				const response = await fetch(url);
				if (!response.ok) {
					// console.warn(
					// 	`[MusicEngine] Failed to load ${track} variant ${i}: ${response.status}`
					// );
					continue; // Skip this variant, try next
				}

				const arrayBuffer = await response.arrayBuffer();
				const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
				this.tracks.set(key, audioBuffer);
				// console.log(`[MusicEngine] Loaded track: ${key}`);
			} catch (error) {
				// console.warn(
				// 	`[MusicEngine] Error loading ${track} variant ${i}:`,
				// 	error
				// );
			}
		}
	}

	async loadAllTracks(): Promise<void> {
		const loadPromises = Array.from(this.trackConfigs.keys()).map((track) =>
			this.loadTrack(track)
		);
		await Promise.all(loadPromises);
		// console.log('[MusicEngine] All tracks loaded');
	}

	async play(track: MusicTrack, fadeInDuration: number = 1.0) {
		if (!this.ctx || !this.masterGain || !this.isInitialized) {
			// console.warn('[MusicEngine] Not initialized, initializing now...');
			await this.init();
		}

		if (!this.ctx || !this.masterGain) return;

		// CRITICAL: Always try to resume context (handles autoplay restrictions)
		if (this.ctx.state === 'suspended') {
			try {
				await this.ctx.resume();
				// console.log('[MusicEngine] Audio context resumed');
			} catch (error) {
				// console.warn(
				// 	'[MusicEngine] Failed to resume audio context:',
				// 	error
				// );
				return;
			}
		}

		// Find all available variants for this track
		const config = this.trackConfigs.get(track);
		if (!config) {
			// console.error(`[MusicEngine] No config for track: ${track}`);
			return;
		}

		const availableVariants: number[] = [];
		for (let i = 0; i < config.urls.length; i++) {
			const key = `${track}-${i}`;
			if (this.tracks.has(key)) {
				availableVariants.push(i);
			}
		}

		if (availableVariants.length === 0) {
			// console.warn(
			// 	`[MusicEngine] No variants loaded for ${track}, attempting to load...`
			// );
			await this.loadTrack(track);
			// Retry after loading
			return this.play(track, fadeInDuration);
		}

		// Randomly select a variant
		const randomIndex =
			availableVariants[
				Math.floor(Math.random() * availableVariants.length)
			];
		const key = `${track}-${randomIndex}`;
		const buffer = this.tracks.get(key);

		if (!buffer) {
			// console.error(`[MusicEngine] Failed to get buffer for: ${key}`);
			return;
		}

		// If same track is already playing, don't restart
		if (this.currentTrack === track && this.isPlaying) {
			// console.log(`[MusicEngine] Track ${track} already playing`);
			return;
		}

		const trackVolume = config?.volume ?? 1.0;
		const loop = config?.loop ?? true;

		// Crossfade out current track if playing
		if (this.currentSource && this.currentGain) {
			this.fadeOut(this.currentSource, this.currentGain, fadeInDuration);
		}

		// Create new source and gain
		const source = this.ctx.createBufferSource();
		source.buffer = buffer;
		source.loop = loop;

		const gain = this.ctx.createGain();
		gain.gain.value = 0; // Start silent for fade in

		source.connect(gain);
		gain.connect(this.masterGain);

		// Fade in
		const now = this.ctx.currentTime;
		gain.gain.setValueAtTime(0, now);
		gain.gain.linearRampToValueAtTime(
			trackVolume * (this.isMuted ? 0 : 1),
			now + fadeInDuration
		);

		source.start(0);

		this.currentSource = source;
		this.currentGain = gain;
		this.currentTrack = track;
		this.currentTrackIndex = randomIndex;
		this.isPlaying = true;

		console.log(
			`[MusicEngine] Playing track: ${track} (variant ${randomIndex})`
		);

		// Handle track end for non-looping tracks
		if (!loop) {
			source.onended = () => {
				if (this.currentSource === source) {
					this.isPlaying = false;
					this.currentTrack = null;
				}
			};
		}
	}

	private fadeOut(
		source: AudioBufferSourceNode,
		gain: GainNode,
		duration: number
	) {
		if (!this.ctx) return;

		const now = this.ctx.currentTime;
		gain.gain.cancelScheduledValues(now);
		gain.gain.setValueAtTime(gain.gain.value, now);
		gain.gain.linearRampToValueAtTime(0, now + duration);

		// Store for cleanup
		this.fadingOutSource = source;
		this.fadingOutGain = gain;

		// Stop and cleanup after fade
		setTimeout(() => {
			try {
				source.stop();
				source.disconnect();
				gain.disconnect();
			} catch (e) {
				// Already stopped
			}
			if (this.fadingOutSource === source) {
				this.fadingOutSource = null;
				this.fadingOutGain = null;
			}
		}, duration * 1000 + 100);
	}

	stop(fadeOutDuration: number = 1.0) {
		if (this.currentSource && this.currentGain) {
			this.fadeOut(this.currentSource, this.currentGain, fadeOutDuration);
			this.currentSource = null;
			this.currentGain = null;
			this.currentTrack = null;
			this.isPlaying = false;
		}
	}

	pause() {
		if (!this.ctx || !this.currentGain) return;
		const now = this.ctx.currentTime;
		this.currentGain.gain.setTargetAtTime(0, now, 0.1);
		this.isPlaying = false;
	}

	resume() {
		if (!this.ctx || !this.currentGain) return;
		const now = this.ctx.currentTime;
		const config = this.currentTrack
			? this.trackConfigs.get(this.currentTrack)
			: null;
		const trackVolume = config?.volume ?? 1.0;
		this.currentGain.gain.setTargetAtTime(
			trackVolume * (this.isMuted ? 0 : 1),
			now,
			0.1
		);
		this.isPlaying = true;
	}

	setVolume(volume: number) {
		this.musicVolume = Math.max(0, Math.min(1, volume));
		if (this.masterGain && this.ctx) {
			const now = this.ctx.currentTime;
			this.masterGain.gain.setTargetAtTime(
				this.isMuted ? 0 : this.musicVolume,
				now,
				0.1
			);
		}
		// Save to localStorage
		localStorage.setItem('musicVolume', this.musicVolume.toString());
	}

	getVolume(): number {
		return this.musicVolume;
	}

	mute() {
		this.isMuted = true;
		if (this.masterGain && this.ctx) {
			const now = this.ctx.currentTime;
			this.masterGain.gain.setTargetAtTime(0, now, 0.1);
		}
	}

	unmute() {
		this.isMuted = false;
		if (this.masterGain && this.ctx) {
			const now = this.ctx.currentTime;
			this.masterGain.gain.setTargetAtTime(this.musicVolume, now, 0.1);
		}
	}

	toggleMute() {
		if (this.isMuted) {
			this.unmute();
		} else {
			this.mute();
		}
	}

	getCurrentTrack(): MusicTrack | null {
		return this.currentTrack;
	}

	getIsPlaying(): boolean {
		return this.isPlaying;
	}

	// Load volume from localStorage
	loadSettings() {
		const savedVolume = localStorage.getItem('musicVolume');
		if (savedVolume) {
			this.musicVolume = parseFloat(savedVolume);
			if (this.masterGain) {
				this.masterGain.gain.value = this.musicVolume;
			}
		}
	}
}
