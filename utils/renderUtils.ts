import { CarState } from '../types';

const PPM = 40; // Pixels Per Meter - Visual Scale

export const drawCar = (
	ctx: CanvasRenderingContext2D,
	car: CarState,
	color: string,
	xOffset: number,
	hasSpoiler: boolean = false
) => {
	const y = -car.y * PPM;
	const w = 40;
	const h = 70;

	// Shadow
	ctx.fillStyle = 'rgba(0,0,0,0.5)';
	ctx.fillRect(xOffset - w / 2 + 5, y + 5, w, h);

	// Body
	ctx.fillStyle = color;
	ctx.fillRect(xOffset - w / 2, y, w, h);

	// Roof
	ctx.fillStyle = 'rgba(0,0,0,0.3)';
	ctx.fillRect(xOffset - w / 2 + 4, y + h / 2, w - 8, h / 3);

	// Lights
	ctx.fillStyle = '#fff9c4';
	ctx.fillRect(xOffset - w / 2 + 2, y + 2, 8, 5);
	ctx.fillRect(xOffset + w / 2 - 10, y + 2, 8, 5);

	ctx.fillStyle = '#ef4444';
	ctx.fillRect(xOffset - w / 2 + 2, y + h - 4, 8, 2);
	ctx.fillRect(xOffset + w / 2 - 10, y + h - 4, 8, 2);

	// Spoiler
	if (hasSpoiler) {
		ctx.fillStyle = color;
		// Wing
		ctx.fillRect(xOffset - w / 2 - 2, y + h - 15, w + 4, 8);
		// Struts
		ctx.fillStyle = '#111';
		ctx.fillRect(xOffset - w / 4, y + h - 10, 4, 6);
		ctx.fillRect(xOffset + w / 4 - 4, y + h - 10, 4, 6);
	} else {
		// Stock Spoiler
		ctx.fillStyle = 'rgba(0,0,0,0.2)';
		ctx.fillRect(xOffset - w / 2, y + h - 8, w, 4);
	}

	// Flames
	if (car.rpm > 6500 && Math.random() > 0.5) {
		ctx.fillStyle = '#f59e0b';
		ctx.fillRect(xOffset - 15, y + h, 10, 10);
		ctx.fillRect(xOffset + 5, y + h, 10, 10);
	}
};
export const drawCircuitCar = (
	ctx: CanvasRenderingContext2D,
	car: CarState,
	color: string,
	hasSpoiler: boolean = false
) => {
	ctx.save();
	// Translate to car position (world space to screen space conversion happens before this or here?)
	// Let's assume the context is already translated to the car's position, or we pass screen coordinates.
	// But wait, the car state has x, y in meters.
	// The caller should handle the camera transform (translating to screen center relative to player).
	// So here we just draw at 0,0 rotated.

	// BUT, the caller loop in GameCanvas iterates cars.
	// It's easier if this function takes the local coordinates (relative to camera).
	// Actually, let's stick to the pattern: Context is transformed to the car's location?
	// No, standard 2D game loop usually transforms context to camera, then draws objects at their world pos.
	// OR transforms context to object pos and draws at 0,0.

	// Let's assume the caller translates to the car's screen position.
	// So we just rotate and draw.

	ctx.rotate(car.angle || 0);

	const w = 40; // Width in pixels (approx 1m)
	const h = 70; // Length in pixels (approx 1.75m)
	// PPM is 40, so 1m = 40px. Car is ~1.8m wide? No, car is ~1.8m wide -> 72px.
	// The existing drawCar uses w=40, h=70. Let's stick to that scale.

	// Shadow
	ctx.fillStyle = 'rgba(0,0,0,0.5)';
	ctx.fillRect(-w / 2 + 5, -h / 2 + 5, w, h);

	// Body
	ctx.fillStyle = color;
	ctx.fillRect(-w / 2, -h / 2, w, h);

	// Roof
	ctx.fillStyle = 'rgba(0,0,0,0.3)';
	ctx.fillRect(-w / 2 + 4, -h / 6, w - 8, h / 3);

	// Lights (Front is UP in standard drawCar, but here angle 0 usually means pointing UP or RIGHT?)
	// In physics, angle 0 usually means pointing along Y or X.
	// Let's assume 0 is UP (negative Y) to match the vertical drag race?
	// Or 0 is Right (positive X)?
	// In the physics I wrote: vx = v * sin(angle), vy = v * cos(angle).
	// If angle=0, vx=0, vy=v. So moving in +Y direction.
	// In canvas, +Y is DOWN.
	// So angle 0 is DOWN.
	// If I want 0 to be UP (standard for top-down games often), I should have used -cos.
	// But let's stick to what I wrote: 0 is +Y (Down).
	// So "Front" is at +h/2.

	// Wait, standard math: 0 is East (Right).
	// My physics: sin(a), cos(a).
	// If a=0, (0, 1). That's +Y (Down).
	// If a=90 (PI/2), (1, 0). That's +X (Right).
	// So 0 is DOWN.
	// So the "Front" of the car is at local y = +h/2.

	// Headlights
	ctx.fillStyle = '#fff9c4';
	ctx.fillRect(-w / 2 + 2, h / 2 - 5, 8, 5);
	ctx.fillRect(w / 2 - 10, h / 2 - 5, 8, 5);

	// Taillights
	ctx.fillStyle = '#ef4444';
	ctx.fillRect(-w / 2 + 2, -h / 2, 8, 2);
	ctx.fillRect(w / 2 - 10, -h / 2, 8, 2);

	// Spoiler
	if (hasSpoiler) {
		ctx.fillStyle = color;
		ctx.fillRect(-w / 2 - 2, -h / 2 + 2, w + 4, 8);
	}

	// Wheels (Visual only)
	ctx.fillStyle = '#111';
	// Front Left
	ctx.save();
	ctx.translate(-w / 2, h / 3);
	ctx.rotate(car.steerAngle || 0);
	ctx.fillRect(-4, -8, 8, 16);
	ctx.restore();

	// Front Right
	ctx.save();
	ctx.translate(w / 2, h / 3);
	ctx.rotate(car.steerAngle || 0);
	ctx.fillRect(-4, -8, 8, 16);
	ctx.restore();

	// Rear Wheels
	ctx.fillRect(-w / 2 - 4, -h / 3 - 8, 8, 16);
	ctx.fillRect(w / 2 - 4, -h / 3 - 8, 8, 16);

	ctx.restore();
};
