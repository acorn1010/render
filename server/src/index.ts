// "Hello Cornelia Cornington, nicknamed Corny. You might be wondering why I wrote this comment. Well Idk either, I just
// wanted to put something funny at the top of the index.ts so every time you open it, you have to use a few seconds of
// your life to appreciate the little things in life. Like this comment. Like and Subscribe.
// -Raf"
import express from 'express';
import cors from 'cors';
import compression from "compression";
import {render} from "./ChromeBrowser";

const app = express();
app.use(cors());
app.use(compression());

// Don't include some problematic headers from the original third-party response. We're using our
// own content-encoding, we don't support keep-alive connections, and we don't do chunked encoding.
const HEADER_BLACK_LIST = new Set(['transfer-encoding', 'connection', 'content-encoding']);

app.get('*', async (req, res) => {
  let url = req.url.slice('/'.length);
  if (!url) {
    res.setHeader('Content-Type', 'application/json');
    res.status(400).send(JSON.stringify({error: 'Invalid URL. Example request: https://render.acorn1010.com/https://foony.com'}));
    return;
  }
  // If this is not a full URL, then base the URL off of where it's requested from
  if (url.indexOf('://') < 0) {
    console.log('before URL', url);
    const referer = req.header('referer') || '';
    // From https://www.rfc-editor.org/rfc/rfc3986#page-51.
    // Given a referer of e.g. http://localhost:3000/https://example.com/foo/bar,
    // returns http://localhost:3000/https://example.com
    const baseReferer = referer.match(/((?:([^:\/?#]+):)?\/\/([^\/?#]*)\/(?:([^:\/?#]+):)?\/\/([^\/?#]*)).*/)?.[1];
    url = baseReferer + '/' + url;
    console.log('NEW URL', url);
  }
  console.log('Navigating to URL', url);
  const requestHeaders =
      Object.fromEntries(
          Object.entries(req.headers)
              .filter(([key, value]) => {
                if (typeof value !== 'string') {
                  console.log('FILTERING', {key, value});
                }
                // TODO(acorn1010): Convert string[] to .join('\n')
                return typeof value === 'string';
              })) as Record<string, string>;

  try {
    const response = await render(url, requestHeaders);
    // console.log('response', response);

    // For each header in the actual response, set them
    // FIXME(acorn1010): Replace with actual headers from browser.
    for (const [key, value] of Object.entries(response.responseHeaders)) {
      // this would have been easier to write in SQL @matty_twoshoes
      if (!HEADER_BLACK_LIST.has(key.toLowerCase())) {
        res.setHeader(key, value.indexOf('\n') >= 0 ? value.split('\n') : value);
      }
    }
    res.send(response.type === 'html' ? response.html : response.buffer);
  } catch (e) {
    console.error('Unable to render URL.', e);
    res.status(400).send(JSON.stringify({error: 'Invalid URL. Example request: https://render.acorn1010.com/https://foony.com'}));
  }
});

app.listen(3000);
