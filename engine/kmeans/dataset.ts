import type { DatasetShape, KMeansPoint } from "./types";

function seededRand(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function gaussian(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-10);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function generateDataset(
  shape: DatasetShape,
  k: number,
  n: number,
  seed: number,
): KMeansPoint[] {
  const rand = seededRand(seed);
  if (shape === "blobs") return generateBlobs(rand, k, n);
  if (shape === "moons") return generateMoons(rand, n);
  return generateRings(rand, n);
}

function generateBlobs(rand: () => number, k: number, n: number): KMeansPoint[] {
  const centers = Array.from({ length: k }, () => ({
    x: 0.15 + rand() * 0.70,
    y: 0.15 + rand() * 0.70,
  }));
  return Array.from({ length: n }, (_, i) => {
    const c = centers[i % k];
    return {
      x: clamp(c.x + gaussian(rand) * 0.09, 0.02, 0.98),
      y: clamp(c.y + gaussian(rand) * 0.09, 0.02, 0.98),
      id: i,
    };
  });
}

function generateMoons(rand: () => number, n: number): KMeansPoint[] {
  const half = Math.floor(n / 2);
  const noise = 0.025;
  const points: KMeansPoint[] = [];
  for (let i = 0; i < half; i++) {
    const t = (i / half) * Math.PI;
    points.push({
      x: clamp(0.25 + 0.28 * Math.cos(t) + gaussian(rand) * noise, 0.02, 0.98),
      y: clamp(0.38 + 0.28 * Math.sin(t) + gaussian(rand) * noise, 0.02, 0.98),
      id: i,
    });
  }
  for (let i = 0; i < n - half; i++) {
    const t = (i / (n - half)) * Math.PI;
    points.push({
      x: clamp(0.47 + 0.28 * Math.cos(t + Math.PI) + gaussian(rand) * noise, 0.02, 0.98),
      y: clamp(0.62 + 0.28 * Math.sin(t + Math.PI) + gaussian(rand) * noise, 0.02, 0.98),
      id: half + i,
    });
  }
  return points;
}

function generateRings(rand: () => number, n: number): KMeansPoint[] {
  const innerCount = Math.floor(n / 3);
  const noise = 0.008;
  return Array.from({ length: n }, (_, i) => {
    const t = rand() * 2 * Math.PI;
    const r = i < innerCount
      ? 0.10 + rand() * 0.03
      : 0.27 + rand() * 0.05;
    return {
      x: clamp(0.5 + r * Math.cos(t) + gaussian(rand) * noise, 0.02, 0.98),
      y: clamp(0.5 + r * Math.sin(t) + gaussian(rand) * noise, 0.02, 0.98),
      id: i,
    };
  });
}
