import type { ConsumerGroupId, TopicId } from "@/domain";

export function partitionKey(topicId: TopicId, partitionIndex: number): string {
  return `${topicId}::${partitionIndex}`;
}

export function committedKey(
  groupId: ConsumerGroupId,
  topicId: TopicId,
  partitionIndex: number,
): string {
  return `${groupId}::${topicId}::${partitionIndex}`;
}
