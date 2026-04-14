import type { ReactNode } from "react";

/**
 * Contract for pluggable lab modules (streaming, algorithms, plotting, …).
 * Each module supplies content for the four primary regions plus charts.
 */
export type LabViewportSlots = {
  controls: ReactNode;
  diagram: ReactNode;
  metrics: ReactNode;
  eventLog: ReactNode;
  charts: ReactNode;
};

export type LabModuleMeta = {
  /** Stable id for routing and analytics */
  id: string;
  /** Short label shown in the shell header */
  label: string;
  /** One-line description under the product title */
  subtitle: string;
};
