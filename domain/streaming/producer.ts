import type { ProducerId, TopicId } from "../shared/ids";

/**
 * Producer-side configuration: how many messages to emit per simulation tick
 * (engine may also expose per-second rates derived from tick duration).
 */
export interface ProducerRateConfig {
  readonly messagesPerTick: number;
}

export interface Producer {
  readonly id: ProducerId;
  readonly topicId: TopicId;
  readonly rate: ProducerRateConfig;
}
