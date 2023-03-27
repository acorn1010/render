/**
 * Returns `true` if `value` is loaded (meaning it's T or null). `undefined` is used to indicate
 * that the location is still being loaded by the database, while `null` means the data doesn't
 * exist within the database.
 */
export function isLoaded<T>(value: T | null | undefined): value is T {
  return value !== undefined;
}
