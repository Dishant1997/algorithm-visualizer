import type { ConsumerGroupId, ConsumerId, TopicId } from "../shared/ids";

/**
 * Consumer group coordinates partition assignment among members for one topic.
 */
export interface ConsumerGroup {
  readonly id: ConsumerGroupId;
  readonly topicId: TopicId;
  readonly memberIds: readonly ConsumerId[];
}
