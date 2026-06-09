import type { KMeansCentroid, KMeansPoint, KMeansState } from "./types";

function dist2(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function nearestCentroid(
  point: KMeansPoint,
  centroids: readonly KMeansCentroid[],
): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < centroids.length; i++) {
    const d = dist2(point, centroids[i]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/** One full E+M iteration. Returns unchanged state if already converged. */
export function stepKMeans(state: KMeansState): KMeansState {
  if (state.phase === "converged") return state;

  const { points, centroids } = state;

  // E-step: assign each point to its nearest centroid
  const assignments = points.map((p) => nearestCentroid(p, centroids));

  // M-step: move each centroid to the mean of its cluster
  const newCentroids: KMeansCentroid[] = centroids.map((c, ci) => {
    const clusterPts = points.filter((_, pi) => assignments[pi] === ci);
    if (clusterPts.length === 0) return c;
    const mx = clusterPts.reduce((s, p) => s + p.x, 0) / clusterPts.length;
    const my = clusterPts.reduce((s, p) => s + p.y, 0) / clusterPts.length;
    return { ...c, x: mx, y: my };
  });

  const maxMove = Math.max(
    ...centroids.map((c, i) => Math.sqrt(dist2(c, newCentroids[i]))),
  );
  const converged = maxMove < 1e-7;

  const inertia = points.reduce(
    (sum, p, pi) => sum + dist2(p, newCentroids[assignments[pi]]),
    0,
  );

  return {
    ...state,
    centroids: newCentroids,
    assignments,
    phase: converged ? "converged" : "running",
    iteration: state.iteration + 1,
    inertia,
  };
}

/** Build initial state: k random centroids picked from the point set. */
export function initKMeans(
  points: readonly KMeansPoint[],
  k: number,
  seed: number,
): KMeansState {
  let s = seed >>> 0;
  const rand = () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };

  // Fisher-Yates shuffle to pick k distinct indices
  const indices = Array.from({ length: points.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const centroids: KMeansCentroid[] = indices.slice(0, k).map((pi, id) => ({
    x: points[pi].x,
    y: points[pi].y,
    id,
  }));

  return {
    points,
    centroids,
    assignments: new Array(points.length).fill(-1),
    phase: "init",
    iteration: 0,
    inertia: Infinity,
  };
}
