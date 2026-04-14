import type { ConsumerGroupId, ConsumerId } from "../shared/ids";

/**
 * A consumer instance belonging to exactly one consumer group.
 * Assignment of partitions is an engine concern; optional snapshot for inspection.
 */
export interface Consumer {
  readonly id: ConsumerId;
  readonly groupId: ConsumerGroupId;
  /** Max messages this consumer can pull + process per tick (simulated capacity). */
  readonly maxMessagesPerTick: number;
  readonly assignedPartitionIndexes?: readonly number[];
}
