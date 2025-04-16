type Point = { x: number, y: number };

function getT(p0: Point, p1: Point, t: number, alpha = 0.5): number {
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const distanceSquared = dx * dx + dy * dy;
    
    if (distanceSquared === 0) {
        return t;  //eviter division par zéro
    }
    
    return t + Math.pow(distanceSquared, alpha * 0.5);
}

export const catmullRomSpline = (points: Point[], samplesPerSegment = 20): Point[] => {
    if (points.length < 2) return points;

    const result: Point[] = [];

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i + 2 < points.length ? points[i + 2] : p2;

        const t0 = 0;
        const t1 = getT(p0, p1, t0);
        const t2 = getT(p1, p2, t1);
        const t3 = getT(p2, p3, t2);

        for (let t = t1; t < t2; t += (t2 - t1) / samplesPerSegment) {
            // Vérification de division par zéro dans les calculs
            const denom1 = t1 - t0;
            const denom2 = t2 - t1;
            const denom3 = t3 - t2;

            if (denom1 === 0 || denom2 === 0 || denom3 === 0) {
                continue;  // Sauter cette itération si division par zéro
            }

            const A1 = {
                x: (t1 - t) / denom1 * p0.x + (t - t0) / denom1 * p1.x,
                y: (t1 - t) / denom1 * p0.y + (t - t0) / denom1 * p1.y
            };

            const A2 = {
                x: (t2 - t) / denom2 * p1.x + (t - t1) / denom2 * p2.x,
                y: (t2 - t) / denom2 * p1.y + (t - t1) / denom2 * p2.y
            };

            const A3 = {
                x: (t3 - t) / denom3 * p2.x + (t - t2) / denom3 * p3.x,
                y: (t3 - t) / denom3 * p2.y + (t - t2) / denom3 * p3.y
            };

            const B1 = {
                x: (t2 - t) / (t2 - t0) * A1.x + (t - t0) / (t2 - t0) * A2.x,
                y: (t2 - t) / (t2 - t0) * A1.y + (t - t0) / (t2 - t0) * A2.y
            };

            const B2 = {
                x: (t3 - t) / (t3 - t1) * A2.x + (t - t1) / (t3 - t1) * A3.x,
                y: (t3 - t) / (t3 - t1) * A2.y + (t - t1) / (t3 - t1) * A3.y
            };

            const C = {
                x: (t2 - t) / (t2 - t1) * B1.x + (t - t1) / (t2 - t1) * B2.x,
                y: (t2 - t) / (t2 - t1) * B1.y + (t - t1) / (t2 - t1) * B2.y
            };

            
            result.push(C);
        }
    }

    // Ajout du dernier point
    result.push(points[points.length - 1]);

    return result;
};
