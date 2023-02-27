import puppeteer, {Browser} from "puppeteer";
import {RenderResponse} from "../db/Schema";
import {fetchPage, logConsole, waitForDomToSettle} from "./BrowserUtils";

/** Maximum lifetime of the browser before it gets killed and recreated. */
const BROWSER_MAX_LIFETIME_MS = 10 * 60_000;

const MAX_OUTSTANDING_REQUESTS = 10;

class ChromeBrowserRunnerSingleton {
  private browser: Promise<Browser> | null = null;

  /** Cache URLs for 60 seconds. TODO(acorn1010): Finish this. */
  // private readonly cache = new LRUCache<string, ResponseForRequest>({
  //   max: 1_000,
  //   maxSize: 1_000_000_000,
  //   sizeCalculation(value) {
  //     return value.body.length || 1;
  //   },
  //   ttl: 60_000,
  // });

  /** Timestamp when the browser was last created. Used to refresh the browser after a while. */
  private createdAt = 0;

  /** All outstanding requests. These need to be resolved before the browser can be closed. */
  private outstandingRequests = new Set<Promise<unknown>>();

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
    const browser = await  browserPromise;
    await Promise.all(requests);  // Wait for requests to complete
    // Close gracefully
    await browser.close();
    // If this browser is still the same one as the promise, then it doesn't exist anymore, so set
    // it to null.
    if (this.browser === browserPromise) {
      this.browser = null;
    }
  }

  public async render(url: string, requestHeaders: Record<string, string>): Promise<RenderResponse> {
    while (this.outstandingRequests.size >= MAX_OUTSTANDING_REQUESTS) {
      await Promise.any(this.outstandingRequests);
    }

    // TODO(acorn1010): Browser can crash if it fails to render here. Do we care? Can happen because
    //  of 20s timeout.
    const request = this.renderPage(url, requestHeaders);
    this.outstandingRequests.add(request);
    request.finally(() => {
      // Remove the outstanding request when it's completed
      this.outstandingRequests.delete(request);
    });
    return request;
  }

  private async renderPage(url: string, requestHeaders: Record<string, string>): Promise<RenderResponse> {
    console.log(`Rendering page: ${url}`);
    const browser = await this.init();
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    try {
      // TODO(acorn1010): Include requestHeaders, but exclude User-Agent?
      // await page.setExtraHTTPHeaders({
      //   // ...requestHeaders,
      //   "user-agent": `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/110.0.5478.${Math.floor(Math.random() * 100_000)} Safari/537.36`,
      // });
      page.setDefaultTimeout(30_000);  // TODO(acorn1010): Is this still necessary?

      logConsole(page);

      const response = await page.goto(url, {waitUntil: 'domcontentloaded'});

      await waitForDomToSettle(page).catch(e => {
        console.warn('Timed out while waiting for DOM', e);
      });

      const html = await page.content();

      // Take a screenshot if not local
      if (process.env.NODE_ENV !== 'production') {
        await page.screenshot({
          type: 'webp',
          encoding: 'binary',
          path: `/home/acorn/projects/js/render/scripts/${new URL(url).pathname}.webp`,
          omitBackground: true,
          quality: 85,
        });
      }

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

  /**
   * Briefly caches requests for a `page`. We do this so that we don't hammer other services
   * (e.g. Cloudflare) to the point where we get temporarily blocked.
   */
  // private async cacheRequests(page: Page) {
  //   await page.setRequestInterception(true);
  //   page.on('request', async (request) => {
  //     // TODO(acorn1010): Can allow aborting the load of images. Should be optional (default false).
  //
  //     const key = JSON.stringify({
  //       url: request.url(),
  //       method: request.method(),
  //       headers: request.headers(),
  //     });
  //     const cachedValue = this.cache.get(key);
  //     if (!cachedValue) {
  //       request.continue().then(() => {});
  //       return;
  //     }
  //
  //     request.respond(cachedValue).then(() => {}).catch(e => {
  //       request.continue().then(() => {});
  //     });
  //   });
  //
  //   page.on('response', async (response) => {
  //     try {
  //       const request = response.request();
  //       const key = JSON.stringify({
  //         url: request.url(),
  //         method: request.method(),
  //         headers: request.headers(),
  //       });
  //       if (!response.ok()) {
  //         return;
  //       }
  //       const {
  //         date,
  //         ['content-length']: contentLength,
  //         origin,
  //         referer,
  //         vary,
  //         server,
  //         ...headers
  //       } = response.headers();
  //       this.cache.set(key, {
  //         headers,
  //         body: await response.buffer(),
  //         status: response.status(),
  //         contentType: headers['content-type'] || 'text/html',
  //       });
  //     } catch (e) {}  // ignore errors
  //   });
  // }
}

const runner = new ChromeBrowserRunnerSingleton();
export async function render(url: string, requestHeaders: Record<string, string>): Promise<RenderResponse> {
  return runner.render(url, requestHeaders);
}
