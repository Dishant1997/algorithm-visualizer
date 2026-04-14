import type { Message } from "@/domain";

import { committedKey, partitionKey } from "./keys";
import { rangeAssignPartitions } from "./pure";
import type { StreamingSimulationConfig, StreamingRuntimeState } from "./types";

/**
 * Builds an empty world at tick 0 with precomputed partition assignments.
 * Callers are expected to pass a coherent config (topics referenced by producers/groups exist).
 */
export function createInitialStreamingState(
  config: StreamingSimulationConfig,
): StreamingRuntimeState {
  const partitionLogs: Record<string, readonly Message[]> = {};
  const committedOffsets: Record<string, number> = {};
  const partitionAssignmentByConsumer: Record<string, readonly number[]> = {};

  const topicsById = new Map(config.topics.map((t) => [t.id, t]));

  for (const topic of config.topics) {
    for (let p = 0; p < topic.partitionCount; p++) {
      partitionLogs[partitionKey(topic.id, p)] = [];
    }
  }

  for (const group of config.consumerGroups) {
    const topic = topicsById.get(group.topicId);
    if (!topic) continue;

    const assign = rangeAssignPartitions(group.memberIds, topic.partitionCount);
    for (const memberId of group.memberIds) {
      partitionAssignmentByConsumer[String(memberId)] = assign.get(memberId) ?? [];
    }

    for (let p = 0; p < topic.partitionCount; p++) {
      committedOffsets[committedKey(group.id, group.topicId, p)] = 0;
    }
  }

  return {
    tick: { index: 0, timeMs: 0 },
    partitionLogs,
    committedOffsets,
    retryEntriesByConsumer: {},
    deadLetterEntriesByTopic: {},
    producerRateCredit: {},
    producerPartitionCursor: {},
    nextMessageSerial: 0,
    partitionAssignmentByConsumer,
  };
}
