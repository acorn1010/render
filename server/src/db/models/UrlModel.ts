import Redis from "ioredis";
import {promisify} from "util";
import zlib from "zlib";
import {DELETE_PATTERN} from "../lua";
import * as Url from "url";
import {nanoid} from "nanoid";
import {getYyyyMm, getYyyyMmDd} from "../../TimeUtils";
import {ConsoleMessageType} from "../../browsers/BrowserUtils";

const decompressBrotli = promisify(zlib.brotliDecompress);
const compressBrotli = promisify(zlib.brotliCompress);

// Cache every hour. Reduce to once per day later on
const CACHE_TIME_MS = 60 * 60 * 1_000;

/** Maximum amount of time in ms to fetch a URL before it expires. */
const REFETCH_BUFFER_MS = 15 * 60_000;

const uuid = nanoid();

export type RenderResponse = {
  renderTimeMs: number,
  headers: Record<string, string>,
  /** Log of the console while rendering the request. */
  console: {type: ConsoleMessageType, args: string[]}[],
  /** Response status code (e.g. 200 for success) */
  statusCode: 200 | 404 | number,
  /** The HTML / binary content of this page */
  buffer: Uint8Array,
};

export class UrlModel {
  constructor(private readonly redis: Redis) {}

  /** Flushes all the URLs for `userId`. Useful when redeploying a site. */
  async flush(userId: string): Promise<number> {
    const result = this.redis.eval(DELETE_PATTERN, 1, `users:${userId}`, `users:${userId}:urls:*`);
    return parseInt(result as any);
  }

  /**
   * Attempts to acquire a lock for `url` (e.g. "https://foony.com/about") for `expirationMs`
   * milliseconds, returning `true` on success.
   */
  async acquireLock(userId: string, url: string, expirationMs: number) {
    const key = `urlExpiresAt:workers:${userId}|${url}`;
    const result = await this.redis.set(key, uuid, 'NX' as any, 'PX' as any, expirationMs as any);
    return result === 'OK';
  }

  /** Removes a lock on the `userId-url` pair that was acquired by #acquireLock early. */
  async removeLock(userId: string, url: string) {
    this.redis.del(`urlExpiresAt:workers:${userId}|${url}`);
  }

  /**
   * Deletes a URL from the expiring URLs collection. Deleting the URL will stop any refetcher from
   * trying to refetch this URL.
   */
  async deleteExpiringUrl(userId: string, url: string) {
    await this.redis.zrem('urlExpiresAt', `${userId}|${url}`);
  }

  /** Returns URLs that are about to expire. Used for re-caching. */
  async queryExpiringUrls(): Promise<{userId: string, url: string}[]> {
    const maxMs = Date.now() + REFETCH_BUFFER_MS;
    const userIdUrls = await this.redis.zrangebyscore('urlExpiresAt', 0, maxMs, 'LIMIT', 0, 1_000);

    return userIdUrls.map(userIdUrl => {
      const index = userIdUrl.indexOf('|');
      const userId = index >= 0 ? userIdUrl.slice(0, index) : 'jellybean';  // FIXME(acorn1010): Delete this fake username once we have auth.
      const url = userIdUrl.slice(index + 1);
      return {userId, url};
    });
  }

  /** Returns the number of times this page has been rendered in the past 2 months. */
  async queryRenderCount(userId: string, url: string): Promise<number> {
    return (await Promise.all([
      this.redis.zscore(`users:${userId}:fetches:${getYyyyMm(-1)}`, url),
      this.redis.zscore(`users:${userId}:fetches:${getYyyyMm()}`, url),
    ])).map(value => +(value || 0)).reduce((a, b) => a + b, 0);
  }

  /**
   * Returns a cached page for `url` if it exists for `userId`. Increments the count of `userAgent`
   * that have requested this page.
   */
  async queryPage({userId, url, userAgent}: {userId: string, url: string, userAgent?: string}): Promise<RenderResponse | null> {
    const key = `users:${userId}:urls:${urlToKey(url)}`;
    const yyyyMm = getYyyyMm();
    const [metadata, data] =
        (await this.redis.multi()
        .get(`${key}:m`)
        .getBuffer(`${key}:d`)
        .zincrby(`${key}:u`, 1, userAgent || '_')
        .pexpire(`${key}:u`, 30 * 24 * 60 * 60 * 1_000)
        .zincrby(`users:${userId}:fetches:${yyyyMm}`, 1, url)
        .pexpire(`users:${userId}:fetches:${yyyyMm}`, 365 * 24 * 60 * 60 * 1_000/*, 'NX'*/)  // NOTE: 'NX' is supported as of v7. Update as soon as it's stable
        .exec()) as any as [[null, RenderResponse], [null, Buffer]];
    if (!metadata?.[1] || !data?.[1]) {
      return null;  // Missing either metadata or the page content itself
    }
    return {
      ...JSON.parse(metadata[1] as any),
      // TODO(acorn1010): Remove when everything is Brotli'd
      buffer: await decompressBrotli(data[1]).catch(() => data[1]),
    };
  }

  /** Sets the page content / metadata of a `url`. */
  async setPage({userId, url, renderResponse}: {userId: string, url: string, renderResponse: RenderResponse}) {
    const now = Date.now();
    const {buffer, ...rest} = renderResponse;
    const statusCode = renderResponse.statusCode;
    const key = `users:${userId}:urls:${urlToKey(url)}`;
    const yyyyMm = getYyyyMm();
    const yyyyMmDd = getYyyyMmDd();
    compressBrotli(Buffer.from(buffer)).then(compressed => {
      const commander = this.redis.multi()
          .incr(`users:${userId}:renderCounts:${yyyyMm}`)  // Number of times user has rendered a page
          .incr(`users:${userId}:renderCounts:${yyyyMmDd}`)  // Number of times user has rendered a page
          .pexpire(`users:${userId}:renderCounts:${yyyyMm}`, 365 * 24 * 60 * 60 * 1_000/*, 'NX'*/)
          .set(`${key}:m`, JSON.stringify(rest), 'PX', CACHE_TIME_MS)
          .setBuffer(`${key}:d`, compressed, 'PX' as any, CACHE_TIME_MS as any);
      // If this request succeeded, then log when it expires so we can refresh it before cache
      // expiration.
      if (statusCode < 400) {
        commander.zadd('urlExpiresAt', now + CACHE_TIME_MS, `${userId}|${url}`);
      }
      commander.exec();
    });
  }
}

/**
 * Given a URL (e.g. "https://api.foony.com/foo/bar"), returns a nice key sorted by TLD, e.g.:
 * "https://com:foony:api/foo/bar"
 */
function urlToKey(url: string): string {
  const {protocol, host, path} = Url.parse(url);

  // `host` will be the domain name + ':port' (if there's a port), so remove the port,
  // reverse the order of the sections, then stick it back together
  const [hostname, port] = (host || '').split(':');
  const reverseHostname = hostname.split('.').reverse().join(':');
  return `${protocol}${reverseHostname}${port ? `:${port}` : ''}${path}`;
}
