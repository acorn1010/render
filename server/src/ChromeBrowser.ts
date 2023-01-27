import puppeteer, {Browser} from "puppeteer";

/** Maximum lifetime of the browser before it gets killed and recreated. */
const BROWSER_MAX_LIFETIME_MS = 10 * 60_000;

const MAX_OUTSTANDING_REQUESTS = 10;

class ChromeBrowserRunnerSingleton {
  private browser: Promise<Browser> | null = null;

  /** Timestamp when the browser was last created. Used to refresh the browser after a while. */
  private createdAt = 0;

  /** All outstanding requests. These need to be resolved before the browser can be closed. */
  private outstandingRequests: Promise<unknown>[] = [];

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
    while (this.outstandingRequests.length >= MAX_OUTSTANDING_REQUESTS) {
      console.log('Max outstanding requests reached. Waiting...');
      await Promise.any(this.outstandingRequests);
    }

    const request = this.renderPage(url, requestHeaders);
    this.outstandingRequests.push(request);
    request.finally(() => {
      // Remove the outstanding request when it's completed
      this.outstandingRequests = this.outstandingRequests.filter(other => request !== other);
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
        return {type: 'buffer', buffer, statusCode, responseHeaders};
      }
      return {type: 'html', html, statusCode, responseHeaders};
    } finally {
      // Swallow page close errors. The browser might have already closed by this point.
      page.close().catch(() => {}).then(() => {});
    }
  }
}

type RenderResponse = {
  responseHeaders: Record<string, string>,
  /** Response status code (e.g. 200 for success) */
  statusCode: 200 | 404 | number,
} & ({
  type: 'html',
  html: string,
} | {
  type: 'buffer',
  buffer: Uint8Array,
});

const runner = new ChromeBrowserRunnerSingleton();
export async function render(url: string, requestHeaders: Record<string, string>): Promise<RenderResponse> {
  return runner.render(url, requestHeaders);
}
