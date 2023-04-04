import puppeteer, {Browser, BrowserContext} from "puppeteer";
import {fetchPage, waitForDomToSettle} from "./BrowserUtils";
import {env} from "../Environment";
import {shuffle} from "lodash";
import {renderAndCache} from "../api/render";
import {RenderResponse} from "../db/models/UrlModel";
import minimatch from "minimatch";
import { User } from "render-shared-library/lib/models/User";

/** Maximum lifetime of the browser before it gets killed and recreated. */
const BROWSER_MAX_LIFETIME_MS = 10 * 60_000;

const MAX_OUTSTANDING_REQUESTS = 10;

const PAGE_EXPIRATION_MS = 30_000;

class ChromeBrowserRunnerSingleton {
  private browser: Promise<Browser> | null = null;
  private userContexts = new Map<string, BrowserContext>();

  /** Timestamp when the browser was last created. Used to refresh the browser after a while. */
  private createdAt = 0;

  /** All outstanding requests. These need to be resolved before the browser can be closed. */
  private outstandingRequests = new Set<Promise<unknown>>();

  /** Returns the current number of outstanding requests. */
  getOutstandingRequestsCount() {
    return this.outstandingRequests.size;
  }

  /** (Re)-initializes the browser. */
  private async init() {
    if (!this.browser || (this.createdAt + BROWSER_MAX_LIFETIME_MS < Date.now())) {
      await this.recreateBrowser();
    }
    return this.browser!;
  }

  private async recreateBrowser() {
    this.closeBrowser().then(() => {});
    this.browser = puppeteer.launch({
      args: ['--hide-scrollbars', '--disable-gpu'],
      defaultViewport: {width: 1024, height: 768},  // phone layout 375 x 667
      ignoreHTTPSErrors: true,
    });
    this.createdAt = Date.now();
  }

  /** Closes the browser gracefully after all outstanding requests are complete. */
  private async closeBrowser() {
    if (!this.browser) {
      return;
    }
    // Copy outstanding requests. New requests may come in while this is processing.
    const requests = [...this.outstandingRequests];
    const browserPromise = this.browser;
    this.userContexts.clear();
    const browser = await browserPromise;
    await Promise.all(requests);  // Wait for requests to complete
    // Close gracefully
    await browser.close();
    // If this browser is still the same one as the promise, then it doesn't exist anymore, so set
    // it to null.
    if (this.browser === browserPromise) {
      this.browser = null;
      this.userContexts.clear();
    }
  }

  public async render(url: string, requestHeaders: Record<string, string>): Promise<RenderResponse> {
    const start = Date.now();
    while (this.outstandingRequests.size >= MAX_OUTSTANDING_REQUESTS) {
      await Promise.any(this.outstandingRequests);
    }

    // TODO(acorn1010): Browser can crash if it fails to render here. Do we care? Can happen because
    //  of 20s timeout.
    const response = this.renderPage(url, requestHeaders);
    this.outstandingRequests.add(response);
    response.finally(() => {
      // Remove the outstanding response when it's completed
      this.outstandingRequests.delete(response);
    });
    const result = await response;
    return {...result, renderTimeMs: Date.now() - start};
  }

  private async renderPage(url: string, requestHeaders: Record<string, string>): Promise<Omit<RenderResponse, 'renderTimeMs'>> {
    console.log(`Rendering page: ${url}`);
    const browser = await this.init();
    // Reuse contexts by the same user / group of users
    const contextKey = getContextKey(requestHeaders);
    const context = this.userContexts.get(contextKey) || await browser.createIncognitoBrowserContext();
    if (context) {
      this.userContexts.set(contextKey, context);
    }
    const page = await context.newPage();
    try {
      // TODO(acorn1010): Include requestHeaders, but exclude User-Agent?
      // await page.setExtraHTTPHeaders({
      //   // ...requestHeaders,
      //   "user-agent": `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/110.0.5478.${Math.floor(Math.random() * 100_000)} Safari/537.36`,
      // });
      page.setDefaultTimeout(PAGE_EXPIRATION_MS);  // TODO(acorn1010): Is this still necessary?

      const response = await page.goto(url, {waitUntil: 'domcontentloaded'});

      console.log(`Waiting for DOM to settle: ${url}`);
      const start = Date.now();
      await waitForDomToSettle(page).catch(e => {
        console.warn('Timed out while waiting for DOM', e);
      });
      console.log(`Waited ${((Date.now() - start) / 1_000).toFixed(1) }s for ${url} to render.`);

      const html = await page.content();

      const responseHeaders = response?.headers() ?? {};
      const statusCode = response?.status() ?? 400;
      if (response && !responseHeaders['content-type']?.includes('text/html')) {
        const buffer = await response.buffer() as Uint8Array;  // TODO(acorn1010): Why is this cast necessary?
        return {buffer, statusCode, responseHeaders};
      }
      return {buffer: Buffer.from(html), statusCode, responseHeaders};
    } catch (e: any) {
      if (e.message.includes('net::ERR_NAME_NOT_RESOLVED')
          || e.message.includes('(Page.navigate): Cannot navigate to invalid URL')) {
        return {statusCode: 404, responseHeaders: {}, buffer: Buffer.from([])};
      } else if (e.message.includes('net::ERR_ABORTED')) {
        console.error(`Unable to render URL: "${url}". Using fallback.`);
        // Failed to fetch. Maybe try without the browser this time?
        return fetchPage(url, requestHeaders);
      }
      console.error('Page failed to render. Recreating browser!', e);
      this.recreateBrowser().then(() => {});
      throw e;
    } finally {
      // Swallow page close errors. The browser might have already closed by this point.
      page.close().catch(() => {}).then(() => {});
    }
  }
}

function getContextKey(requestHeaders: Record<string, string>) {
  const {
      ['x-request-id']: xRequestId,  // Changes every time

      // These change when a user's IP / that user changes. Because bots are distributed, this
      // could cause a new context to be made.
      ['x-real-ip']: xRealIp,
      ['x-forwarded-for']: xForwardedFor,
      ['x-original-forwarded-for']: xOriginalForwardedFor,
      ['cf-ray']: cfRay,
      ['cf-connecting-ip']: cfConnectingIp,

      ...rest
  } = requestHeaders;
  return JSON.stringify(rest);
}

const runner = new ChromeBrowserRunnerSingleton();
export async function render(url: string, requestHeaders: Record<string, string>): Promise<RenderResponse> {
  return runner.render(url, requestHeaders);
}

class Refetcher {
  private timeout: NodeJS.Timeout | null = null;
  constructor(private readonly runner: ChromeBrowserRunnerSingleton) {}

  /** Starts a page refetcher that is responsible for refetching pages that are expiring. */
  start() {
    if (this.timeout) {
      return;  // Already running
    }
    this.scheduleInterval();
  }

  close() {
    if (this.timeout) {
      clearInterval(this.timeout);
    }
    this.timeout = null;
  }

  private scheduleInterval() {
    this.timeout = setTimeout(async () => {
      try {
        await this.render();
      } finally {
        if (this.timeout) {
          this.scheduleInterval();
        }
      }
    }, 100);
  }

  private async render() {
    // Browser is free to do work! Refresh cache that's about to expire.
    const userIdUrls = shuffle(await env.redis.url.queryExpiringUrls());
    const userIdToUser = new Map<string, Pick<User, 'shouldRefreshCache' | 'ignoredPaths'>>();
    for (const {userId, url} of userIdUrls) {
      if (!this.timeout) {
        return;  // Timeout was canceled.
      }
      if (this.runner.getOutstandingRequestsCount() > 0) {
        return;  // Browser is busy. Wait.
      }

      if (!userIdToUser.has(userId)) {
        userIdToUser.set(
            userId,
            await env.redis.user.queryKeys(userId, 'ignoredPaths', 'shouldRefreshCache'));
      }
      // Attempt to acquire a lock. If successful, render the page.
      const start = Date.now();
      if (!await env.redis.url.acquireLock(userId, url, PAGE_EXPIRATION_MS)) {
        continue;  // Unable to establish lock. Someone else is rendering this page.
      }
      try {
        // Successfully acquired lock. We have ~35 seconds to render this page!
        // First, check to see if this page has enough usage. If not, delete it and let it expire.
        const reason = await maybeGetRenderSkipReason(url, userId, userIdToUser.get(userId)!);
        if (reason) {
          console.log(`Skipping render for user: ${userId}`, reason);
          continue;
        }

        console.log('Re-rendering before cache expiration', userId, url);
        await renderAndCache(userId, url, {});
      } finally {
        // If we still hold the lock, clean it up. Small race condition possible here, but I don't
        // want to make a Lua script just for this, so w/e.
        if (start + PAGE_EXPIRATION_MS > Date.now()) {
          env.redis.url.removeLock(userId, url).catch((e) => {
            console.error('Failed to remove lock', e);
          });
        }
      }
    }
  }
}

/** Returns a non-empty string if `url` shouldn't be rendered. */
async function maybeGetRenderSkipReason(url: string, userId: string, user: Pick<User, 'shouldRefreshCache' | 'ignoredPaths'>): Promise<string> {
  if (!user.shouldRefreshCache) {
    return `Not rendering because shouldNotRefreshCache: "${url}"`;
  }
  for (const ignoredPath of user.ignoredPaths) {
    if (minimatch(url, ignoredPath)) {
      return `Not rendering because matched ignorePath: "${url}", "${ignoredPath}"`;
    }
  }

  const renderCount = await env.redis.url.queryRenderCount(userId, url);
  if (renderCount < 2) {
    return `Not rendering because too low renderCount: "${url}", ${renderCount}`;
  }

  return '';
}

export const refetcher = new Refetcher(runner);
