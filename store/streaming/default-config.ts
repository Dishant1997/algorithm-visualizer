import type { StreamingSimulationConfig } from "@/engine/streaming/types";
import {
  consumerGroupId,
  consumerId,
  producerId,
  topicId,
} from "@/engine/streaming/branded";

/**
 * Sensible defaults for local development and UI wiring.
 * Swap via `updateConfig` or replace wholesale for scenarios.
 */
export function createDefaultStreamingConfig(): StreamingSimulationConfig {
  const t = topicId("events");
  const g = consumerGroupId("processors");
  const p = producerId("producer-1");
  const c0 = consumerId("consumer-a");
  const c1 = consumerId("consumer-b");

  return {
    msPerTick: 50,
    topics: [
      {
        id: t,
        name: "events",
        partitionCount: 4,
      },
    ],
    producers: [
      {
        id: p,
        topicId: t,
        rate: { messagesPerTick: 4 },
        routing: "hash",
      },
    ],
    consumers: [
      { id: c0, groupId: g, maxMessagesPerTick: 6 },
      { id: c1, groupId: g, maxMessagesPerTick: 6 },
    ],
    consumerGroups: [
      {
        id: g,
        topicId: t,
        memberIds: [c0, c1],
      },
    ],
    retryPolicy: {
      maxAttempts: 3,
      backoffTicks: 2,
    },
    deterministicFailure: {
      failureMod: 0,
    },
  };
}
