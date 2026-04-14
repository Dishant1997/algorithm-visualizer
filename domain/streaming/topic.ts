import type { TopicId } from "../shared/ids";

/**
 * Topic definition: fan-out unit with a fixed partition count for the simulator.
 */
export interface Topic {
  readonly id: TopicId;
  readonly name: string;
  readonly partitionCount: number;
}
