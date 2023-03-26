import Redis from "ioredis";
import {Pretty} from "../../types/ExtraTypes";
import {isNil} from "lodash";

const DEFAULT_USER = {
  /** Wildcard to match the page title for 404 pages. These pages will return a `404` status code. */
  wildcard404: '' as string,

  /**
   * If `true`, the pages that were fetched in the last month will be refreshed right before they
   * expire from the cache.
   */
  shouldRefreshCache: false as boolean,

  /**
   * Wildcard patterns, such as "foo.com/games/*". You shouldn't specify the http:// prefix. If a
   * pattern starts with "*" followed by "/", then it will apply to all domains.
   */
  ignoredPaths: [] as string[],
} as const;
export type User = typeof DEFAULT_USER;

export class UserModel {
  constructor(private readonly redis: Redis) {}

  /** Given a user token, returns the userId for that token, or `null` if not found. */
  async getUserIdByToken(token: string): Promise<string | null> {
    return this.redis.hget('tokens', token);
  }

  async queryKeys<K extends keyof User>(userId: string, ...keys: K[]): Promise<Pretty<Omit<User, Exclude<keyof User, K>>>> {
    const result = await this.redis.hmget(`{users:${userId}}`, ...keys);
    return Object.fromEntries(
        result.map((value, idx) => [keys[idx], isNil(value) ? DEFAULT_USER[keys[idx]] : JSON.parse(value)])
    ) as Pretty<Omit<User, Exclude<keyof User, K>>>;
  }
}
