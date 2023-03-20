import {ConsoleMessage, JSHandle, Page} from "puppeteer";
import {RenderResponse} from "../db/Schema";

/**
 * Waits for the DOM to finish rendering. If there are no DOM changes for `debounceMs`, then the
 * page is considered to be done rendering.
 */
export async function waitForDomToSettle(page: Page, timeoutMs = 5_000, debounceMs = 750): Promise<void> {
  const url = page.url();
  return page.evaluate(
      (timeoutMs, debounceMs, url) => {
        function debounce<T extends Function>(func: T, ms = 1_000): T {
          let timeout: ReturnType<typeof setTimeout>;
          return ((...args: unknown[]) => {
            clearTimeout(timeout);
            // @ts-ignore
            timeout = setTimeout(() => func.apply(this, args), ms);
          }) as any;
        }

        // TODO(acorn1010): Try to close JavaScript dialogs after 1 second
        console.log('Beginning to inject!');
        window.addEventListener('error', function(event) {
          console.log('error was logged', event);
          event.stopImmediatePropagation();
        }, true);

        return new Promise<void>((resolve, reject) => {
          const mainTimeout = setTimeout(() => {
            observer.disconnect();
            reject(new Error("Timed out while waiting for DOM to settle: " + url));
          }, timeoutMs);

          const debouncedResolve = debounce(() => {
            observer.disconnect();
            clearTimeout(mainTimeout);
            resolve();
          }, debounceMs);

          const observer = new MutationObserver(() => debouncedResolve());
          const config = {attributes: true, childList: true, subtree: true};
          observer.observe(document.body, config);
          // It's possible this was a static page, which won't change the DOM, so fire off an
          // initial debounce.
          debouncedResolve();
        });
      },
      timeoutMs,
      debounceMs,
      url,
  );
}

/** Prints the `page`'s console to stdout. Useful in debugging. */
export function logConsole(page: Page) {
  const describe = (jsHandle: JSHandle) => {
    return (jsHandle as any).executionContext().evaluate((obj: any) => {
      // serialize |obj| however you want
      try {
        return `OBJ: ${typeof obj}, ${JSON.stringify(obj)}`;
      } catch (e) {
        return `OBJ: ${typeof obj} (circular)`;
      }
    }, jsHandle);
  }

  // listen to browser console there
  page.on('console', async (message: ConsoleMessage) => {
    const args = await Promise.all(message.args().map(arg => describe(arg)));
    // make ability to paint different console[types]
    const type = message.type().substr(0, 3).toUpperCase();
    let text = '';
    for (let i = 0; i < args.length; ++i) {
      text += `  [${i}] ${args[i]}, `;
    }
    console.log(type, `${message.text()}\n${text}\n`);
  });
}

/** Fetches a static page. Doesn't do any rendering. Used as a fallback in case the render fails. */
export async function fetchPage(url: string, requestHeaders: Record<string, string>): Promise<Omit<RenderResponse, 'renderTimeMs'>> {
  try {
    const response = await fetch(url/*, {headers: requestHeaders}*/);
    // FIXME(acorn1010): Something in here is failing. What could it be?
    // const response = await fetch(url, {
    //   "host": "localhost:3000",
    //   "connection": "keep-alive",
    //   "upgrade-insecure-requests": "1",
    //   "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/110.0.5478.0 Safari/537.36",
    //   "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    //   "sec-fetch-site": "none",
    //   "sec-fetch-mode": "navigate",
    //   "sec-fetch-user": "?1",
    //   "sec-fetch-dest": "document",
    //   "accept-encoding": "gzip, deflate, br"
    // });
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
