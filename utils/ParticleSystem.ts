export interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	size: number;
	color: string;
	alpha: number;
	decay: number;
	type: 'SMOKE' | 'FLAME' | 'SPARK';
}

export class ParticleSystem {
	particles: Particle[] = [];

	update(dt: number) {
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const p = this.particles[i];
			p.life -= dt;

			if (p.life <= 0) {
				this.particles.splice(i, 1);
				continue;
			}

			p.x += p.vx * dt;
			p.y += p.vy * dt;

			// Physics per type
			if (p.type === 'SMOKE') {
				p.size += 10 * dt; // Expand
				p.alpha -= p.decay * dt;
				p.vx *= 0.95; // Drag
				p.vy *= 0.95;
			} else if (p.type === 'FLAME') {
				p.size -= 5 * dt; // Shrink
				p.alpha -= p.decay * dt;
			} else if (p.type === 'SPARK') {
				p.vy += 9.8 * dt * 10; // Gravity
				p.alpha -= p.decay * dt;
			}
		}
	}

	draw(ctx: CanvasRenderingContext2D, cameraY: number) {
		const PPM = 40;

		this.particles.forEach((p) => {
			if (p.alpha <= 0) return;

			const screenY = cameraY + p.y * PPM;
			// Assuming x is relative to track center (0)
			const screenX = ctx.canvas.width / 2 + p.x;

			// Wait, p.x and p.y should be in meters or pixels?
			// Let's use meters for physics consistency.
			// So p.x is meters from center.
			// p.y is meters (world space).

			// But drawCar uses a transform.
			// If we draw particles in world space, we need to match that transform.
			// In GameCanvas, we translate to (width/2, camTransY).
			// So we should draw relative to that if we call this inside the transformed context.
			// OR we handle the transform here.

			// Let's assume this is called inside the transformed context (same as drawCar).
			// So 0,0 is the camera center? No.
			// In GameCanvas:
			// ctx.translate(canvas.width / 2, 0);
			// ctx.translate(0, camTransY);
			// So (0,0) is at x=center, y=camera_offset.
			// Wait, camTransY = screenOffset + p.y * PPM.
			// So (0, -p.y*PPM) is the car's position?
			// Let's check GameCanvas render loop.

			// ctx.translate(canvas.width / 2, 0);
			// ctx.translate(0, camTransY);
			// Car is drawn at y = -car.y * PPM.
			// So if particle is at world Y, we draw at -particle.y * PPM.

			const drawY = -p.y * PPM;
			const drawX = p.x; // p.x is in pixels? No, meters * PPM?
			// Let's store p.x in pixels for lateral, because track width is fixed in pixels (300).
			// Actually, let's store everything in meters.

			ctx.save();
			ctx.globalAlpha = p.alpha;
			ctx.fillStyle = p.color;
			ctx.beginPath();
			ctx.arc(p.x * PPM, drawY, p.size, 0, Math.PI * 2);
			ctx.fill();
			ctx.restore();
		});
	}

	emit(
		x: number,
		y: number,
		count: number,
		type: 'SMOKE' | 'FLAME' | 'SPARK',
		options: {
			speed?: number;
			angle?: number;
			spread?: number;
			color?: string;
			size?: number;
			life?: number;
		} = {}
	) {
		for (let i = 0; i < count; i++) {
			const angle =
				(options.angle || 0) +
				(Math.random() - 0.5) * (options.spread || 1);
			const speed = (options.speed || 1) * (0.5 + Math.random());

			this.particles.push({
				x: x,
				y: y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: options.life || 1.0,
				maxLife: options.life || 1.0,
				size: options.size || 5,
				color:
					options.color || (type === 'SMOKE' ? '#cccccc' : '#ffaa00'),
				alpha: 1.0,
				decay: 1.0 / (options.life || 1.0),
				type,
			});
		}
	}
}
