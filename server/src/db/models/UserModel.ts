import Redis from "ioredis";
import {range} from "lodash";
import {getYyyyMm} from "../../TimeUtils";
import {User} from "@shared/models/User";
import {REFRESH_USER_TOKEN} from "../lua";
import {AbstractHashModel} from "@server/db/models/AbstractHashModel";

export class UserModel extends AbstractHashModel<User> {
  constructor(redis: Redis) {
    super(redis, 'users', {
      /** Wildcard to match the page title for 404 pages. These pages will return a `404` status code. */
      wildcard404: '',

      /**
       * If `true`, the pages that were fetched in the last month will be refreshed right before they
       * expire from the cache.
       */
      shouldRefreshCache: false,

      /**
       * Wildcard patterns, such as "foo.com/games/*". You shouldn't specify the http:// prefix. If a
       * pattern starts with "*" followed by "/", then it will apply to all domains.
       */
      ignoredPaths: [],

      /** The user's private API key. Used to make requests via Cloudflare Workers / HTTPS. */
      token: '',
    });
  }

  /** Given a user token, returns the userId for that token, or `null` if not found. */
  async getUserIdByToken(token: string): Promise<string | null> {
    return this.redis.hget('tokens', token);
  }

  /** Returns the number of renders this user has done by month. */
  async getMonthlyRenderCounts(userId: string): Promise<{month: string, renderCount: number}[]> {
    // We store renderCounts for the past 12 months, so go ahead and figure out all keys we need to
    // query.
    const months = range(-12, 1).map(monthOffset => getYyyyMm(monthOffset));
    const result = await this.redis.mget(months.map(month => `users:${userId}:renderCounts:${month}`));
    return result.map((count, i) => ({month: months[i], renderCount: count === null ? 0 : parseInt(count)}));
  }

  /** Expires the old user token and generates a new one to use. */
  async refreshToken(userId: string): Promise<string> {
    return this.redis.eval(REFRESH_USER_TOKEN, 0, userId) as Promise<string>;
  }
}
