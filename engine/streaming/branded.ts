import type {
  ConsumerGroupId,
  ConsumerId,
  MessageId,
  ProducerId,
  TopicId,
} from "@/domain";

export function messageId(value: string): MessageId {
  return value as MessageId;
}

export function topicId(value: string): TopicId {
  return value as TopicId;
}

export function producerId(value: string): ProducerId {
  return value as ProducerId;
}

export function consumerId(value: string): ConsumerId {
  return value as ConsumerId;
}

export function consumerGroupId(value: string): ConsumerGroupId {
  return value as ConsumerGroupId;
}
