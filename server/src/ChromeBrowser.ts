import puppeteer, {BrowserContext} from "puppeteer";

type RenderResponse = {
  html: string,
  responseHeaders: Record<string, string>,
  /** Response status code (e.g. 200 for success) */
  statusCode: 200 | 404 | number,
};
export async function render(url: string, requestHeaders: Record<string, string>): Promise<RenderResponse> {
  // TODO(acorn1010): Optimize this. Persist the browser between requests, closing pages as necessary.
  const browser = await puppeteer.launch({
    args: ['--hide-scrollbars', '--disable-gpu'],
    defaultViewport: {width: 1024, height: 768},
  });
  const [context, originalUserAgent]: [BrowserContext, string] = await Promise.all([
    browser.createIncognitoBrowserContext(),
    browser.userAgent(),
  ]);
  console.log('Original user agent', originalUserAgent);
  try {
    const page = await context.newPage();
    try {
      page.setDefaultTimeout(20_000);

      // TODO(acorn1010): Try to close JavaScript dialogs after 1 second
      // TODO(acorn1010): Add support for continuing on certificate errors

      // await Promise.all([
      //     page.setUserAgent(`${originalUserAgent} Acorn1010 (+https://https://github.com/acorn1010/render)`),
      //     page.setExtraHTTPHeaders(requestHeaders),
      // ]);

      const response = await page.goto(url);
      const html = await page.evaluate(() => document.body.innerHTML);
      console.log(html, {response});
      return {html, statusCode: response?.status() ?? 400, responseHeaders: response?.headers?.() ?? {}};
    } finally {
      // Swallow page close errors. The browser might have already closed by this point.
      // page.close().catch(() => {}).then(() => {});
    }
  } finally {
    browser.close().then(() => {});
  }
}
