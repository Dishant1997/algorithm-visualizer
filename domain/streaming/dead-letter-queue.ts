import type { DeadLetterQueueId, TopicId } from "../shared/ids";
import type { Message } from "./message";

export interface DeadLetterEntry {
  readonly message: Message;
  readonly reason: string;
  readonly deadLetteredAtTick: number;
  readonly finalAttemptCount: number;
}

/**
 * Poison messages that exceeded retry policy (Kafka-style DLQ / dead-letter topic).
 */
export interface DeadLetterQueue {
  readonly id: DeadLetterQueueId;
  readonly topicId: TopicId;
  readonly entries: readonly DeadLetterEntry[];
}
