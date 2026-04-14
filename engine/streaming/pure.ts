import type { ConsumerId } from "@/domain";

/** Deterministic 32-bit-ish string hash (stable across runtimes). */
export function stableHash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/**
 * Kafka-style range assignment: sort members, split partition ids into contiguous ranges.
 * Empty member list yields an empty map.
 */
export function rangeAssignPartitions(
  memberIds: readonly ConsumerId[],
  partitionCount: number,
): ReadonlyMap<ConsumerId, readonly number[]> {
  const sorted = [...memberIds].sort((a, b) => a.localeCompare(b));
  const out = new Map<ConsumerId, readonly number[]>();
  if (sorted.length === 0 || partitionCount <= 0) {
    return out;
  }

  const base = Math.floor(partitionCount / sorted.length);
  let extra = partitionCount % sorted.length;
  let start = 0;

  for (const id of sorted) {
    const count = base + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    const parts: number[] = [];
    for (let i = 0; i < count; i++) {
      parts.push(start + i);
    }
    start += count;
    out.set(id, parts);
  }

  return out;
}

/**
 * Picks a partition for a produced message. Keyed traffic is sticky via hashing;
 * keyless traffic uses round-robin per producer for an even spread.
 */
export function pickPartitionIndex(params: {
  readonly partitionCount: number;
  readonly partitionKey?: string;
  readonly roundRobinCursor: number;
}): { readonly partitionIndex: number; readonly nextRoundRobinCursor: number } {
  const { partitionCount, partitionKey, roundRobinCursor } = params;
  if (partitionCount <= 0) {
    return { partitionIndex: 0, nextRoundRobinCursor: roundRobinCursor };
  }
  if (partitionKey !== undefined) {
    const idx = stableHash(partitionKey) % partitionCount;
    return { partitionIndex: idx, nextRoundRobinCursor: roundRobinCursor };
  }
  const partitionIndex = roundRobinCursor % partitionCount;
  return {
    partitionIndex,
    nextRoundRobinCursor: roundRobinCursor + 1,
  };
}

export function shouldFailProcessing(params: {
  readonly failureMod: number;
  readonly seed: string;
}): boolean {
  const { failureMod, seed } = params;
  if (failureMod <= 0) return false;
  return stableHash(seed) % failureMod === 0;
}
