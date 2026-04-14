/**
 * Branded string IDs keep producer/topic/consumer references distinct at compile time.
 * Runtime values are plain strings; engines create IDs deterministically.
 */
type Brand<T extends string, B extends string> = T & { readonly __brand: B };

export type ProducerId = Brand<string, "ProducerId">;
export type ConsumerId = Brand<string, "ConsumerId">;
export type ConsumerGroupId = Brand<string, "ConsumerGroupId">;
export type TopicId = Brand<string, "TopicId">;
export type MessageId = Brand<string, "MessageId">;
export type RetryQueueId = Brand<string, "RetryQueueId">;
export type DeadLetterQueueId = Brand<string, "DeadLetterQueueId">;
