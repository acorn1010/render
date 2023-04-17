/**
 * A weak hash that, given a `key` and `seed`, returns a 32-bit positive integer hash.
 *
 * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
 * @see http://github.com/garycourt/murmurhash-js
 * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
 * @see http://sites.google.com/site/murmurhash/
 *
 * @param {string} key ASCII only
 * @param {number} seed Positive integer only
 * @return {number} 32-bit positive integer hash
 */
export function weakHash(key: string, seed: number) {
  let remainder, bytes, h1, h1b, c1, c2, k1, i;

  remainder = key.length & 3; // key.length % 4
  bytes = key.length - remainder;
  h1 = Math.abs(seed);
  c1 = 0xcc9e2d51;
  c2 = 0x1b873593;
  i = 0;

  while (i < bytes) {
    k1 =
        ((key.charCodeAt(i) & 0xff)) |
        ((key.charCodeAt(++i) & 0xff) << 8) |
        ((key.charCodeAt(++i) & 0xff) << 16) |
        ((key.charCodeAt(++i) & 0xff) << 24);
    ++i;

    k1 = ((((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16))) & 0xffffffff;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = ((((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16))) & 0xffffffff;

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1b = ((((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16))) & 0xffffffff;
    h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
  }

  k1 = 0;

  // Unwrapped switch statement because TypeScript was complaining about case fallthrough.
  if (remainder === 3) {
    k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
  }
  if (remainder >= 2) {
    k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
  }
  if (remainder >= 1) {
    k1 ^= (key.charCodeAt(i) & 0xff);
  }
  k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
  k1 = (k1 << 15) | (k1 >>> 17);
  k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
  h1 ^= k1;

  h1 ^= key.length;

  h1 ^= h1 >>> 16;
  h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
  h1 ^= h1 >>> 13;
  h1 = ((((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16))) & 0xffffffff;
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

/**
 * Modeled after base64 web-safe chars, but ordered by ASCII. These are the characters allowed in a
 * short push id, such as the one used for all rooms.
 */
export const SHORT_PUSH_ID_CHARS = '123456789abcdefghijkmnopqrstuvwxyz';
export const SHORT_PUSH_ID_LENGTH = 8;
/**
 * Generates a short, Firebase-esque push ID. This is used for roomIds and other areas where the
 * push ID is visible to the public and needs to be easy to type.
 *
 * Unlike a Firebase push ID, the returned ID has no timestamp component and has ~40-bits of
 * entropy. This is enough for an 89% chance of no collisions at 1M push ids. The id also does not
 * contain commonly-confused characters ("O", "0", "l", "I").
 *
 * NOTE: This means the short push IDs are not chronologically ordered.
 *
 * See: https://instacalc.com/28845 for calculation of probabilities (Birthday paradox).
 */
export function generateShortPushId() {
  let id = '';

  for (let i = 0; i < SHORT_PUSH_ID_LENGTH; ++i) {
    id += SHORT_PUSH_ID_CHARS.charAt(Math.floor(Math.random() * SHORT_PUSH_ID_CHARS.length));
  }
  if (id.length !== SHORT_PUSH_ID_LENGTH) {
    throw new Error(`Short PushID length should be ${SHORT_PUSH_ID_LENGTH}.`);
  }

  return id;
}

/** Lowercases the first character of `value` (e.g. "BOb" -> "bOb") */
export function lowerFirst(value: string) {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : '';
}
