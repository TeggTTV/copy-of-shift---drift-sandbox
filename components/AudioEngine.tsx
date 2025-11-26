export class AudioEngine {
	public ctx: AudioContext | null = null;
	public analyser: AnalyserNode | null = null;
	private masterGain: GainNode | null = null;

	// Synthesis Nodes
	private mainOsc: OscillatorNode | null = null;
	private subOsc: OscillatorNode | null = null;
	private harmonicsOsc: OscillatorNode | null = null;

	private engineBus: GainNode | null = null;

	// LFOs
	private textureLfo: OscillatorNode | null = null;
	private textureGain: GainNode | null = null;

	private idleLfo: OscillatorNode | null = null;
	private idleGain: GainNode | null = null;

	// Noise
	private noiseNode: AudioBufferSourceNode | null = null;
	private noiseGain: GainNode | null = null;
	private noiseFilter: BiquadFilterNode | null = null;

	// Drift
	private driftOsc: OscillatorNode | null = null;
	private driftGain: GainNode | null = null;
	private driftFilter: BiquadFilterNode | null = null;

	// Exhaust Chain
	private distortion: WaveShaperNode | null = null;
	private mufflerFilter: BiquadFilterNode | null = null;
	private highShelf: BiquadFilterNode | null = null;

	private isInitialized = false;

	// Config
	private currentCylinders = 6;
	private exhaustOpenness = 0.1;
	private backfireAggression = 0.3;

	// Cache for performance
	private distortionCurveCache: Float32Array | null = null;
	private lastDistortionAmount: number = -1;

	// State for noise generation
	private lastNoise: number = 0;

	constructor() {}

	async init() {
		if (this.isInitialized) return;

		const AudioContext =
			window.AudioContext || (window as any).webkitAudioContext;
		this.ctx = new AudioContext();

		// Master Output
		this.masterGain = this.ctx.createGain();
		this.masterGain.gain.value = 0.4;

		this.analyser = this.ctx.createAnalyser();
		this.analyser.fftSize = 2048;
		this.analyser.smoothingTimeConstant = 0.6;
		this.masterGain.connect(this.analyser);
		this.analyser.connect(this.ctx.destination);

		this.engineBus = this.ctx.createGain();

		// Exhaust Chain
		this.distortion = this.ctx.createWaveShaper();
		this.distortion.oversample = '4x';

		this.mufflerFilter = this.ctx.createBiquadFilter();
		this.mufflerFilter.type = 'lowpass';

		this.highShelf = this.ctx.createBiquadFilter();
		this.highShelf.type = 'highshelf';
		this.highShelf.frequency.value = 4000;
		this.highShelf.gain.value = 0;

		this.engineBus.connect(this.distortion);
		this.distortion.connect(this.mufflerFilter);
		this.mufflerFilter.connect(this.highShelf);
		this.highShelf.connect(this.masterGain);

		// Oscillators
		this.mainOsc = this.ctx.createOscillator();
		this.mainOsc.type = 'sawtooth';
		const mainGain = this.ctx.createGain();
		mainGain.gain.value = 0.35;
		this.mainOsc.connect(mainGain);
		mainGain.connect(this.engineBus);

		this.subOsc = this.ctx.createOscillator();
		this.subOsc.type = 'sine';
		const subGain = this.ctx.createGain();
		subGain.gain.value = 0.3;
		this.subOsc.connect(subGain);
		subGain.connect(this.engineBus);

		this.harmonicsOsc = this.ctx.createOscillator();
		this.harmonicsOsc.type = 'square';
		const harmoGain = this.ctx.createGain();
		harmoGain.gain.value = 0.1;
		this.harmonicsOsc.connect(harmoGain);
		harmoGain.connect(this.engineBus);

		// Modulators
		this.textureLfo = this.ctx.createOscillator();
		this.textureLfo.type = 'sine';
		this.textureGain = this.ctx.createGain();
		this.textureLfo.connect(this.textureGain);
		this.textureGain.connect(this.mainOsc.frequency);

		this.idleLfo = this.ctx.createOscillator();
		this.idleLfo.type = 'sine';
		this.idleLfo.frequency.value = 6;
		this.idleGain = this.ctx.createGain();
		this.idleGain.gain.value = 0;
		this.idleLfo.connect(this.idleGain);
		this.idleGain.connect(this.engineBus.gain);

		// Noise - Intake/Mechanical
		const bufferSize = this.ctx.sampleRate * 2;
		const buffer = this.ctx.createBuffer(
			1,
			bufferSize,
			this.ctx.sampleRate
		);
		const data = buffer.getChannelData(0);
		let b0 = 0,
			b1 = 0,
			b2 = 0,
			b3 = 0,
			b4 = 0,
			b5 = 0,
			b6 = 0;
		for (let i = 0; i < bufferSize; i++) {
			const white = Math.random() * 2 - 1;
			// Pinkish noise filter
			b0 = 0.99886 * b0 + white * 0.0555179;
			b1 = 0.99332 * b1 + white * 0.0750759;
			b2 = 0.969 * b2 + white * 0.153852;
			b3 = 0.8665 * b3 + white * 0.3104856;
			b4 = 0.55 * b4 + white * 0.5329522;
			b5 = -0.7616 * b5 - white * 0.016898;
			data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
			data[i] *= 0.11;
			b6 = white * 0.115926;
		}
		this.noiseNode = this.ctx.createBufferSource();
		this.noiseNode.buffer = buffer;
		this.noiseNode.loop = true;

		this.noiseGain = this.ctx.createGain();
		this.noiseFilter = this.ctx.createBiquadFilter();
		this.noiseFilter.type = 'bandpass';
		this.noiseFilter.Q.value = 0.6;

		this.noiseNode.connect(this.noiseFilter);
		this.noiseFilter.connect(this.noiseGain);
		this.noiseGain.connect(this.engineBus);

		// Drift
		this.driftOsc = this.ctx.createOscillator();
		this.driftOsc.type = 'sawtooth';
		this.driftFilter = this.ctx.createBiquadFilter();
		this.driftFilter.type = 'bandpass';
		this.driftFilter.Q.value = 8;
		this.driftGain = this.ctx.createGain();
		this.driftGain.gain.value = 0;

		this.driftOsc.connect(this.driftFilter);
		this.driftFilter.connect(this.driftGain);
		this.driftGain.connect(this.masterGain);

		this.mainOsc.start();
		this.subOsc.start();
		this.harmonicsOsc.start();
		this.textureLfo.start();
		this.idleLfo.start();
		this.noiseNode.start();
		this.driftOsc.start();

		this.isInitialized = true;
		if (this.ctx.state === 'suspended') await this.ctx.resume();
	}

	setConfiguration(
		cylinders: number,
		exhaustOpenness: number,
		backfireAggression: number
	) {
		this.currentCylinders = cylinders;
		this.exhaustOpenness = exhaustOpenness;
		this.backfireAggression = backfireAggression;

		// Update distortion curve only if needed
		// More open exhaust = more aggressive distortion curve
		const drive = 50 + this.exhaustOpenness * 400;
		if (
			this.distortion &&
			Math.abs(drive - this.lastDistortionAmount) > 1
		) {
			this.distortion.curve = this.makeDistortionCurve(drive);
			this.lastDistortionAmount = drive;
		}
	}

	update(rpm: number, load: number, driftIntensity: number = 0) {
		if (!this.ctx || !this.isInitialized) return;
		const now = this.ctx.currentTime;

		const rps = Math.max(rpm / 60, 10);
		const fundamental = rps * (this.currentCylinders / 2);

		// Cylinder Profiles
		let subRatio = 0.5;
		let harmRatio = 2.0;
		let fmDepth = 0.3;

		if (this.currentCylinders === 4) {
			subRatio = 0.5;
			harmRatio = 1.5;
			if (this.subOsc) this.subOsc.type = 'square';
			fmDepth = 0.2;
		} else if (this.currentCylinders === 6) {
			subRatio = 0.5;
			harmRatio = 2.0;
			if (this.subOsc) this.subOsc.type = 'sine';
			fmDepth = 0.35;
		} else if (this.currentCylinders === 8) {
			subRatio = 0.5;
			harmRatio = 4.0;
			if (this.subOsc) this.subOsc.type = 'sawtooth';
			fmDepth = 0.6;
		} else if (this.currentCylinders >= 10) {
			subRatio = 1.0;
			harmRatio = 1.5;
			if (this.subOsc) this.subOsc.type = 'triangle';
			fmDepth = 0.2;
		}

		// Frequencies
		this.mainOsc?.frequency.setTargetAtTime(fundamental, now, 0.02);
		this.subOsc?.frequency.setTargetAtTime(
			fundamental * subRatio,
			now,
			0.02
		);
		this.harmonicsOsc?.frequency.setTargetAtTime(
			fundamental * harmRatio,
			now,
			0.02
		);

		// Organic Detuning (Jitter)
		// Randomize detune slightly based on load to remove robotic "perfect phase"
		if (this.mainOsc) {
			const jitter = (Math.random() * 15 - 7.5) * (load + 0.1);
			this.mainOsc.detune.setTargetAtTime(jitter, now, 0.05);
		}
		if (this.harmonicsOsc) {
			const jitter = Math.random() * 20 - 10;
			this.harmonicsOsc.detune.setTargetAtTime(jitter, now, 0.05);
		}

		// FM Texture (Grit)
		const textureFreq = fundamental * 0.5;
		this.textureLfo?.frequency.setTargetAtTime(textureFreq, now, 0.1);
		const modIndex = fundamental * fmDepth * (0.1 + load * 0.5);
		this.textureGain?.gain.setTargetAtTime(modIndex, now, 0.05);

		// Idle Lope (Cam chop)
		if (rpm < 1100 && this.currentCylinders > 4) {
			const lopeAmount =
				(1 - rpm / 1100) * (this.exhaustOpenness * 0.5 + 0.1);
			this.idleGain?.gain.setTargetAtTime(lopeAmount, now, 0.1);
			this.idleLfo?.frequency.setValueAtTime(5 + Math.random() * 2, now);
		} else {
			this.idleGain?.gain.setTargetAtTime(0, now, 0.5);
		}

		// Exhaust Tone Filtering
		if (this.mufflerFilter && this.highShelf) {
			// Muffled at low RPM, opens up at high RPM
			const minCutoff = 600 + this.exhaustOpenness * 400;
			const maxCutoff = 8000 + this.exhaustOpenness * 12000;
			const cutoff = minCutoff + (rpm / 9000) * (maxCutoff - minCutoff);

			this.mufflerFilter.frequency.setTargetAtTime(cutoff, now, 0.1);

			// High shelf adds "sizzle" or "rasp"
			const airGain = -20 + this.exhaustOpenness * 30;
			this.highShelf.gain.setTargetAtTime(airGain, now, 0.1);
		}

		// Intake/Mechanical Noise
		if (this.noiseFilter && this.noiseGain) {
			const noiseFreq = 400 + rpm * 1.5;
			this.noiseFilter.frequency.setTargetAtTime(noiseFreq, now, 0.1);

			// Intake noise is loudest at high load
			const noiseVol = load * 0.5 + rpm * 0.00002;
			this.noiseGain.gain.setTargetAtTime(noiseVol, now, 0.1);
		}

		// Overrun Crackles (Burble Tune)
		if (rpm > 3500 && load < 0.1) {
			// Chance to pop per frame
			// Open exhaust = more pops
			const chance = this.backfireAggression * 0.1;
			if (Math.random() < chance) {
				const popVol = 0.2 + this.exhaustOpenness * 0.4;
				this.createPop(popVol);
			}
		}

		// Drift Screech
		if (driftIntensity > 0.1) {
			const screechFreq = 600 + driftIntensity * 800;
			this.driftFilter?.frequency.setTargetAtTime(screechFreq, now, 0.1);

			const driftVol = Math.min(driftIntensity * 0.5, 0.4);
			this.driftGain?.gain.setTargetAtTime(driftVol, now, 0.05);
		} else {
			this.driftGain?.gain.setTargetAtTime(0, now, 0.2);
		}
	}

	triggerBackfire() {
		if (!this.ctx || !this.masterGain) return;
		const vol = 0.8 + this.exhaustOpenness * 0.5;
		this.createPop(vol);
	}

	triggerLimiter() {
		if (!this.ctx || !this.engineBus) return;
		const now = this.ctx.currentTime;

		// Hard cut
		this.engineBus.gain.setValueAtTime(0, now);
		this.engineBus.gain.linearRampToValueAtTime(1, now + 0.08);

		this.createPop(0.5);
	}

	triggerShift(isDownshift: boolean) {
		if (!this.ctx || !this.masterGain) return;

		// Mechanical Transmission Thud
		// Downshifts are "thuddier", Upshifts are sharper
		const freq = isDownshift ? 100 : 180;
		this.createNoiseBurst(0.06, 0.4, freq);

		// Downshift Bark
		if (isDownshift && this.exhaustOpenness > 0.2) {
			// Slight delay for the "blip"
			setTimeout(() => {
				this.createPop(0.3);
			}, 50);
		}
	}

	// New Realistic Pop Generator (Noise-based instead of Oscillator)
	private createPop(volume: number) {
		if (!this.ctx || !this.masterGain) return;

		const duration = 0.15;
		const bufferSize = this.ctx.sampleRate * duration;
		const buffer = this.ctx.createBuffer(
			1,
			bufferSize,
			this.ctx.sampleRate
		);
		const data = buffer.getChannelData(0);

		// Generate unique noise impulse for organic sound
		// Use stateful lastNoise for Brownian-like motion (smoother noise)
		for (let i = 0; i < bufferSize; i++) {
			const white = Math.random() * 2 - 1;
			this.lastNoise = (this.lastNoise + 0.1 * white) / 1.1;
			data[i] = this.lastNoise * 5.0; // Boost gain
			// Soft clip
			if (data[i] > 1) data[i] = 1;
			if (data[i] < -1) data[i] = -1;
		}

		const source = this.ctx.createBufferSource();
		source.buffer = buffer;

		const filter = this.ctx.createBiquadFilter();
		filter.type = 'lowpass';
		// Randomize filter to make every pop sound slightly different (exhaust resonance)
		filter.frequency.value = 300 + Math.random() * 800;
		filter.Q.value = 2;

		const gain = this.ctx.createGain();
		// Randomize volume slightly
		const finalVol = volume * (0.8 + Math.random() * 0.4);

		gain.gain.setValueAtTime(finalVol, this.ctx.currentTime);
		// Fast exponential decay
		gain.gain.exponentialRampToValueAtTime(
			0.01,
			this.ctx.currentTime + duration * 0.8
		);

		source.connect(filter);
		filter.connect(gain);

		// Route through distortion for that "exhaust crackle" texture
		if (this.distortion) {
			gain.connect(this.distortion);
		} else {
			gain.connect(this.masterGain);
		}

		source.start();
	}

	// Generic noise burst for mechanical sounds
	private createNoiseBurst(
		duration: number,
		peakVolume: number,
		filterFreq: number
	) {
		if (!this.ctx || !this.masterGain) return;

		const bufferSize = this.ctx.sampleRate * duration;
		const buffer = this.ctx.createBuffer(
			1,
			bufferSize,
			this.ctx.sampleRate
		);
		const data = buffer.getChannelData(0);

		for (let i = 0; i < bufferSize; i++) {
			data[i] = Math.random() * 2 - 1;
		}

		const noise = this.ctx.createBufferSource();
		noise.buffer = buffer;

		const noiseGain = this.ctx.createGain();
		noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);
		noiseGain.gain.linearRampToValueAtTime(
			peakVolume,
			this.ctx.currentTime + 0.005
		);
		noiseGain.gain.exponentialRampToValueAtTime(
			0.001,
			this.ctx.currentTime + duration
		);

		const noiseFilter = this.ctx.createBiquadFilter();
		noiseFilter.type = 'lowpass';
		noiseFilter.frequency.value = filterFreq;

		noise.connect(noiseFilter);
		noiseFilter.connect(noiseGain);
		noiseGain.connect(this.masterGain);

		noise.start();
		setTimeout(() => {
			noise.stop();
			noise.disconnect();
			noiseGain.disconnect();
			noiseFilter.disconnect();
		}, duration * 1000 + 100);
	}

	private makeDistortionCurve(amount: number) {
		const k = amount;
		const n_samples = 44100;
		const curve = new Float32Array(n_samples);
		const deg = Math.PI / 180;
		for (let i = 0; i < n_samples; ++i) {
			const x = (i * 2) / n_samples - 1;
			curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
		}
		return curve;
	}
}
