/**
 * Wall-clock pacing for automatic simulation steps (distinct from engine `msPerTick`).
 * Timers stay outside React components; always dispose on pause/unmount.
 */

export type WallTimerDisposer = () => void;

export type TickSchedulerOptions = {
  readonly wallIntervalMs: number;
};

/**
 * Repeating `setInterval` loop. Minimum interval is 1 ms to avoid browser clamp surprises.
 */
export function startWallClockLoop(
  tick: () => void,
  options: TickSchedulerOptions,
): WallTimerDisposer {
  if (typeof window === "undefined") {
    return () => {};
  }

  const id = window.setInterval(tick, Math.max(1, options.wallIntervalMs));
  return () => window.clearInterval(id);
}

/**
 * Optional rAF-based pacing: invokes `tick` when `wallIntervalMs` has elapsed on the
 * animation timeline. Fewer wakeups than per-frame work when the budget is large.
 */
export function startAnimationFrameLoop(
  tick: () => void,
  options: TickSchedulerOptions,
): WallTimerDisposer {
  if (typeof window === "undefined") {
    return () => {};
  }

  let raf = 0;
  let last = 0;
  let cancelled = false;
  const budget = Math.max(1, options.wallIntervalMs);

  const loop = (now: number) => {
    if (cancelled) return;
    raf = window.requestAnimationFrame(loop);
    if (last === 0 || now - last >= budget) {
      last = now;
      tick();
    }
  };

  raf = window.requestAnimationFrame(loop);
  return () => {
    cancelled = true;
    window.cancelAnimationFrame(raf);
  };
}
