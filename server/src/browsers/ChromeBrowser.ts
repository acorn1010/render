import puppeteer, {Browser} from "puppeteer";
import {RenderResponse} from "../db/Schema";

/** Maximum lifetime of the browser before it gets killed and recreated. */
const BROWSER_MAX_LIFETIME_MS = 10 * 60_000;

const MAX_OUTSTANDING_REQUESTS = 10;

class ChromeBrowserRunnerSingleton {
  private browser: Promise<Browser> | null = null;

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
    const browser = await this.browser;
    await Promise.all(requests);  // Wait for requests to complete
    // Close gracefully
    await browser.close();
  }

  public async render(url: string, requestHeaders: Record<string, string>): Promise<RenderResponse> {
    console.log(`onRender: ${url}`);
    while (this.outstandingRequests.size >= MAX_OUTSTANDING_REQUESTS) {
      console.log('Max outstanding requests reached. Waiting...');
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
      page.setDefaultTimeout(20_000);

      // TODO(acorn1010): Try to close JavaScript dialogs after 1 second

      const response = await page.goto(url);
      let html = await page.content();
      try {
        await page.waitForNetworkIdle({timeout: 3_000});
        html = await page.content();
      } catch (e: any) {}  // Ignore timeouts when the network isn't idle
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

/** Fetches a static page. Doesn't do any rendering. Used as a fallback in case the render fails. */
async function fetchPage(url: string, requestHeaders: Record<string, string>): Promise<RenderResponse> {
  try {
    const response = await fetch(url/*, {headers: requestHeaders}*/);
    return {
      statusCode: response.status,
      responseHeaders: Object.fromEntries(response.headers.entries()),
      buffer: Buffer.from(await response.arrayBuffer()),
    };
  } catch (e) {
    console.error(`render URL fetch failed: ${url}`, e);
  }
  return {statusCode: 500, responseHeaders: {}, buffer: Buffer.from([])};
}

const runner = new ChromeBrowserRunnerSingleton();
export async function render(url: string, requestHeaders: Record<string, string>): Promise<RenderResponse> {
  return runner.render(url, requestHeaders);
}
