
/** Localizes a number "value" to its comma-separated value for the user's locale. */
export function localizeNumber(number: number): string {
  return number.toLocaleString(navigator.language ?? 'en-US');
}
