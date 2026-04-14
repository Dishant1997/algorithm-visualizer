import type { ConsumerId, RetryQueueId } from "../shared/ids";
import type { Message } from "./message";

export interface RetryEntry {
  readonly message: Message;
  readonly attemptCount: number;
  readonly scheduledForTick: number;
}

/**
 * Messages pending retry before success or dead-lettering.
 * Typically scoped per consumer or per group depending on engine design.
 */
export interface RetryQueue {
  readonly id: RetryQueueId;
  readonly consumerId: ConsumerId;
  readonly entries: readonly RetryEntry[];
  readonly maxAttempts: number;
}
