
// Track geometry and logic

export interface Point {
    x: number;
    y: number;
}

// A circuit inspired by classic race tracks (mix of straights, hairpins, and sweepers)
// Coordinates in meters
const TRACK_POINTS: Point[] = [
    { x: 0, y: 0 },         // Start/Finish
    { x: 0, y: -300 },      // Long straight
    { x: 50, y: -400 },     // Entry Turn 1
    { x: 150, y: -400 },    // Exit Turn 1
    { x: 200, y: -300 },    
    { x: 200, y: -100 },    // Back straight 1
    { x: 250, y: 0 },       // Sweeper
    { x: 400, y: 50 },
    { x: 500, y: -50 },
    { x: 500, y: -200 },    // Fast section
    { x: 600, y: -300 },
    { x: 750, y: -300 },    // Hairpin setup
    { x: 800, y: -250 },
    { x: 800, y: -100 },    // Hairpin
    { x: 750, y: -50 },
    { x: 600, y: -50 },     // Return leg
    { x: 400, y: 150 },     // Technical section
    { x: 200, y: 150 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },       // Final corner
    { x: 0, y: 0 }          // Loop close
];

// Catmull-Rom spline interpolation to make the track smooth
const getSplinePoints = (points: Point[], segmentsPerPoint: number = 10): Point[] => {
    const result: Point[] = [];
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i === 0 ? points.length - 2 : i - 1];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2 >= points.length ? 1 : i + 2];

        for (let t = 0; t < 1; t += 1 / segmentsPerPoint) {
            const t2 = t * t;
            const t3 = t2 * t;

            const q0 = -t3 + 2 * t2 - t;
            const q1 = 3 * t3 - 5 * t2 + 2;
            const q2 = -3 * t3 + 4 * t2 + t;
            const q3 = t3 - t2;

            const x = 0.5 * (p0.x * q0 + p1.x * q1 + p2.x * q2 + p3.x * q3);
            const y = 0.5 * (p0.y * q0 + p1.y * q1 + p2.y * q2 + p3.y * q3);
            result.push({ x, y });
        }
    }
    result.push(points[points.length - 1]); // Close loop
    return result;
};

export const TRACK_PATH = getSplinePoints(TRACK_POINTS, 10);
export const TRACK_WIDTH = 24; // Meters wide
export const GRASS_FRICTION = 0.6; // Lower grip
export const ASPHALT_FRICTION = 1.0; 

// Helper to find distance from point to line segment
function distToSegment(p: Point, v: Point, w: Point) {
    const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
    if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

export const getTrackInfo = (x: number, y: number) => {
    let minDist = Infinity;
    
    // Check distance to center spline
    // Optimization: Check only nearby segments could be added, but current track is small enough
    for (let i = 0; i < TRACK_PATH.length - 1; i++) {
        const d = distToSegment({x, y}, TRACK_PATH[i], TRACK_PATH[i+1]);
        if (d < minDist) minDist = d;
    }

    const isOnTrack = minDist < (TRACK_WIDTH / 2);
    
    // Friction modifier based on surface
    const gripMod = isOnTrack ? 1.0 : 0.6;
    const dragMod = isOnTrack ? 1.0 : 5.0; // Grass slows you down significantly

    return { isOnTrack, gripMod, dragMod, distanceToCenter: minDist };
};

export const drawTrack = (ctx: CanvasRenderingContext2D, PPM: number) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Grass Edge (Border)
    ctx.beginPath();
    ctx.strokeStyle = '#4d7c0f'; // Dark Green border
    ctx.lineWidth = (TRACK_WIDTH + 4) * PPM;
    ctx.moveTo(TRACK_PATH[0].x * PPM, TRACK_PATH[0].y * PPM);
    for (let i = 1; i < TRACK_PATH.length; i++) {
        ctx.lineTo(TRACK_PATH[i].x * PPM, TRACK_PATH[i].y * PPM);
    }
    ctx.stroke();

    // 2. Curbs (Red/White stripes simulation)
    // We just draw a slightly wider line than the road with a pattern
    ctx.beginPath();
    ctx.strokeStyle = '#b91c1c'; // Red
    ctx.lineWidth = (TRACK_WIDTH + 2) * PPM;
    ctx.setLineDash([2 * PPM, 2 * PPM]);
    ctx.moveTo(TRACK_PATH[0].x * PPM, TRACK_PATH[0].y * PPM);
    for (let i = 1; i < TRACK_PATH.length; i++) {
        ctx.lineTo(TRACK_PATH[i].x * PPM, TRACK_PATH[i].y * PPM);
    }
    ctx.stroke();
    
    // White curb parts
    ctx.beginPath();
    ctx.strokeStyle = '#f5f5f5'; 
    ctx.lineDashOffset = 2 * PPM;
    ctx.moveTo(TRACK_PATH[0].x * PPM, TRACK_PATH[0].y * PPM);
    for (let i = 1; i < TRACK_PATH.length; i++) {
        ctx.lineTo(TRACK_PATH[i].x * PPM, TRACK_PATH[i].y * PPM);
    }
    ctx.stroke();
    ctx.setLineDash([]); // Reset dash

    // 3. Asphalt
    ctx.beginPath();
    ctx.strokeStyle = '#333333'; // Dark Asphalt
    ctx.lineWidth = TRACK_WIDTH * PPM;
    ctx.moveTo(TRACK_PATH[0].x * PPM, TRACK_PATH[0].y * PPM);
    for (let i = 1; i < TRACK_PATH.length; i++) {
        ctx.lineTo(TRACK_PATH[i].x * PPM, TRACK_PATH[i].y * PPM);
    }
    ctx.stroke();
    
    // 4. Groove/Racing Line (Subtle)
    ctx.beginPath();
    ctx.strokeStyle = '#262626'; // Darker rubbered-in line
    ctx.lineWidth = (TRACK_WIDTH * 0.5) * PPM;
    ctx.moveTo(TRACK_PATH[0].x * PPM, TRACK_PATH[0].y * PPM);
    for (let i = 1; i < TRACK_PATH.length; i++) {
        ctx.lineTo(TRACK_PATH[i].x * PPM, TRACK_PATH[i].y * PPM);
    }
    ctx.stroke();

    // 5. Start/Finish Line
    const startP = TRACK_PATH[0];
    const nextP = TRACK_PATH[1];
    const angle = Math.atan2(nextP.y - startP.y, nextP.x - startP.x);
    
    ctx.save();
    ctx.translate(startP.x * PPM, startP.y * PPM);
    ctx.rotate(angle);
    
    // Checkerboard pattern
    const rows = 3;
    const cols = 8;
    const size = (TRACK_WIDTH * PPM) / cols;
    
    ctx.translate(0, - (TRACK_WIDTH * PPM) / 2); // Move to top edge
    
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            ctx.fillStyle = (r+c)%2 === 0 ? '#fff' : '#000';
            ctx.fillRect(c*size - (size*cols)/2, r*size, size, size);
        }
    }
    
    ctx.restore();
};
