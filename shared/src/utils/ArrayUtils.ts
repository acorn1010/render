import {isEqual} from 'moderndash';

/**
 * Shuffles an "array" in-place and returns the array. Uses the Durstenfeld shuffle.<br />
 * See: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
export function shuffleArray<T extends any>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function last(value: []): undefined;
export function last<const T extends any[], const L>(value: [...T, L]): L;
/**
 * Returns the last element of `values`, or `undefined` if passed an empty list.
 * Credit to github.com/tobshub for the really clever last<const T, const L> above!
 * Credit to keraion for removing the ts-ignore requirement above!
 * @param values
 */
export function last<const T>(values: T[]): T | undefined;
export function last<T>(values: T[]): T | undefined {
  return values[values.length - 1];
}

export function deepUnique<const T>(values: T[]): T[] {
  return values.filter((element, index) => values.findIndex((step) => isEqual(element, step)) === index);
}
