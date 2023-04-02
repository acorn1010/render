// noinspection JSUnusedGlobalSymbols This function is used in both the client and server.
/** Clamps a value to be between [min, max] (inclusive). */
export function clamp(value: number, min: number, max: number) {
  return min < max
      ? Math.max(min, Math.min(value, max))
      : Math.max(max, Math.min(value, min));
}
