import Redis from "ioredis";

export type User = {
  /**
   * RegEx to match the page title for 404 pages. These pages will return a `404` status code.
   */
  regex404?: string,

  /**
   * If `true`, the pages that were fetched in the last month will be refreshed right before they
   * expire from the cache.
   */
  shouldRefreshCache?: boolean,
};

export class UserModel {
  constructor(private readonly redis: Redis) {}

  /** Given a user token, returns the userId for that token, or `null` if not found. */
  async getUserIdByToken(token: string): Promise<string | null> {
    return this.redis.hget('tokens', token);
  }

  async queryKey<K extends keyof User>(userId: string, key: K): Promise<User[K] | null> {
    const result = await this.redis.hget(`{users:${userId}}`, key);
    return result === null ? null : JSON.parse(result);
  }
}
