export type User = {
  /** Wildcard to match the page title for 404 pages. These pages will return a `404` status code. */
  wildcard404: string,

  /**
   * If `true`, the pages that were fetched in the last month will be refreshed right before they
   * expire from the cache.
   */
  shouldRefreshCache: boolean,

  /**
   * Wildcard patterns, such as "foo.com/games/*". You shouldn't specify the http:// prefix. If a
   * pattern starts with "*" followed by "/", then it will apply to all domains.
   */
  ignoredPaths: string[],

  /** The user's private API key. Used to make requests via Cloudflare Workers / HTTPS. */
  token: string,
};
