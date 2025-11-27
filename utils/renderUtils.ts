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
