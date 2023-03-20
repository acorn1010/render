import express from "express";
import {render} from "../browsers/ChromeBrowser";
import {env} from "../Environment";
import {RenderResponse} from "../db/models/UrlModel";

// Don't include some problematic headers from the original third-party response. We're using our
// own content-encoding, we don't support keep-alive connections, and we don't do chunked encoding.
const HEADER_BLACK_LIST = new Set(['transfer-encoding', 'connection', 'content-encoding']);

export async function doRequest(req: express.Request, res: express.Response) {
  let url = req.url.slice('/'.length);
  if (!url || !url.match(/^https?:\/\//)) {
    res.setHeader('Content-Type', 'application/json');
    res.status(400).send(JSON.stringify({error: 'Invalid URL. Example request: https://render.acorn1010.com/https://foony.com'}));
    return;
  }
  // If this is not a full URL, then base the URL off of where it's requested from. This isn't
  // really necessary and could be deleted without affecting the service. It's more for local
  // development.
  if (url.indexOf('://') < 0) {
    const referer = req.header('referer') || '';
    // From https://www.rfc-editor.org/rfc/rfc3986#page-51.
    // Given a referer of e.g. http://localhost:3000/https://example.com/foo/bar,
    // returns http://localhost:3000/https://example.com
    const baseReferer = referer.match(/((?:([^:\/?#]+):)?\/\/([^\/?#]*)\/(?:([^:\/?#]+):)?\/\/([^\/?#]*)).*/)?.[1];
    url = (baseReferer ?? referer) + '/' + url;
  }
  console.log('Navigating to URL', url);

  const userId = req.user?.userId || '';
  let response: RenderResponse | null = null;
  const cachedResult = await env.redis.url.queryPage({
    url, userAgent: req.header('User-Agent'), userId
  });
  if (cachedResult) {
    response = cachedResult;
  }

  // TODO(acorn1010): Instead of trying to render this directly, stick it in a worker queue
  //  and wait for it to be finished. This will reduce API flakiness.
  if (!response) {
    response = await renderAndCache(userId, url, getRequestHeaders(req));
  }

  if (!response) {
    res.status(400).send(
        JSON.stringify(
            {error: `Invalid URL. Got: "${url}". Example request: "https://render.acorn1010.com/https://foony.com".`}
        ));
    return;
  }

  // For each header in the actual response, set them
  for (const [key, value] of Object.entries(response.responseHeaders)) {
    // this would have been easier to write in SQL @matty_twoshoes
    if (!HEADER_BLACK_LIST.has(key.toLowerCase())) {
      res.setHeader(key, value.indexOf('\n') >= 0 ? value.split('\n') : value);
    }
  }
  res.send(response.buffer);
}

function getRequestHeaders(req: express.Request): Record<string, string> {
  return Object.fromEntries(
      Object.entries(req.headers)
      .filter(([key, value]) => {
        if (typeof value !== 'string') {
          console.log('FILTERING', {key, value});
        }
        // TODO(acorn1010): Convert string[] to .join('\n')
        return typeof value === 'string';
      })) as Record<string, string>;
}

/** Renders a `URL` on behalf of `userId` and caches the result if successful. */
export async function renderAndCache(
    userId: string,
    url: string,
    headers: Record<string, string>): Promise<RenderResponse | null> {
  const result = await render(url, headers).catch(e => {
    console.error('Unable to render URL.', e);
    return null;
  });
  if (!result) {
    return null;
  }
  // TODO(acorn1010): Should we return early instead of saving if it failed to render?
  //  (e.g. 300+ error)
  env.redis.url.setPage({userId, url, renderResponse: result}).catch(e => {
    console.error('Failed to set page.', e);
  });
  return result;
}
