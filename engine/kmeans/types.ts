export type DatasetShape = "blobs" | "moons" | "rings";

export type KMeansPoint = {
  readonly x: number;
  readonly y: number;
  readonly id: number;
};

export type KMeansCentroid = {
  readonly x: number;
  readonly y: number;
  readonly id: number;
};

/** "init" = centroids placed, no assignments yet; "running" = iterating; "converged" = done */
export type KMeansPhase = "init" | "running" | "converged";

export type KMeansState = {
  readonly points: readonly KMeansPoint[];
  readonly centroids: readonly KMeansCentroid[];
  /** Centroid index for each point (-1 = unassigned) */
  readonly assignments: readonly number[];
  readonly phase: KMeansPhase;
  readonly iteration: number;
  /** Within-cluster sum of squares (WCSS). Infinity before first assignment. */
  readonly inertia: number;
};
