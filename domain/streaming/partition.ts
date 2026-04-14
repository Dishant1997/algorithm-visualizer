import type { TopicId } from "../shared/ids";

/**
 * Identifies a single partition within a topic (static identity).
 * Log end offsets and replica leadership live in engine state / metrics snapshots.
 */
export interface Partition {
  readonly topicId: TopicId;
  readonly index: number;
}
