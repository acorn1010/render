import puppeteer, {BrowserContext} from "puppeteer";

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
export async function render(url: string, requestHeaders: Record<string, string>): Promise<RenderResponse> {
  // TODO(acorn1010): Optimize this. Persist the browser between requests, closing pages as necessary.
  const browser = await puppeteer.launch({
    args: ['--hide-scrollbars', '--disable-gpu'],
    defaultViewport: {width: 1024, height: 768},  // phone layout 375 x 667
    ignoreHTTPSErrors: true,
  });
  const [context, originalUserAgent]: [BrowserContext, string] = await Promise.all([
    browser.createIncognitoBrowserContext(),
    browser.userAgent(),
  ]);
  try {
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
      // page.close().catch(() => {}).then(() => {});
    }
  } finally {
    browser.close().then(() => {});
  }
}
