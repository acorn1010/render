import express from "express";
import {render} from "../browsers/ChromeBrowser";
import {env} from "../Environment";
import {RenderResponse} from "../db/Schema";
import * as Url from "url";
import * as zlib from "zlib";
import { promisify } from "util";

// Don't include some problematic headers from the original third-party response. We're using our
// own content-encoding, we don't support keep-alive connections, and we don't do chunked encoding.
const HEADER_BLACK_LIST = new Set(['transfer-encoding', 'connection', 'content-encoding']);

const CACHE_TIME_MS = 24 * 60 * 60 * 1_000;

const decompressBrotli = promisify(zlib.brotliDecompress);
const compressBrotli = promisify(zlib.brotliCompress);

export async function doRequest(req: express.Request, res: express.Response) {
  const start = Date.now();
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
  const key = `{users:${userId}}:urls:${urlToKey(url)}`;
  const yyyyMm = getYyyyMm();
  const [metadata, data] =
      (await env.redis.multi()
          .get(`${key}:m`)
          .getBuffer(`${key}:d`)
          .zincrby(`${key}:u`, 1, req.header('User-Agent') || '_')
          .zincrby(`{users:${userId}}:fetches:${yyyyMm}`, 1, url)
          .pexpire(`{users:${userId}}:fetches:${yyyyMm}`, 365 * 24 * 60 * 60 * 1_000/*, 'NX'*/)  // NOTE: 'NX' is supported as of v7. Update as soon as it's stable
          .exec()) as any as [[null, RenderResponse], [null, Buffer]];
  if (metadata?.[1] && data?.[1]) {
    response = {
      ...JSON.parse(metadata[1] as any),
      // TODO(acorn1010): Remove when everything is Brotli'd
      buffer: await decompressBrotli(data[1]).catch(() => data[1]),
    };
  }

  // TODO(acorn1010): Instead of trying to render this directly, stick it in a worker queue
  //  and wait for it to be finished. This will reduce API flakiness.
  if (!response) {
    response = await renderUrl(req, url);
    if (response) {
      const {buffer, ...rest} = response;
      // Set the page cache and increment the number of pages this user has cached this month.
      const now = Date.now();
      const statusCode = response.statusCode;
      compressBrotli(Buffer.from(buffer)).then(compressed => {
        const commander = env.redis.multi()
            .incr(`{users:${userId}}:renderCounts:${yyyyMm}`)  // Number of times user has rendered a page
            .pexpire(`{users:${userId}}:renderCounts:${yyyyMm}`, 365 * 24 * 60 * 60 * 1_000/*, 'NX'*/)
            .set(`${key}:m`, JSON.stringify({...rest, renderTimeMs: now - start}), 'PX', CACHE_TIME_MS)
            .setBuffer(`${key}:d`, compressed, 'PX' as any, CACHE_TIME_MS as any);
        // If this request succeeded, then log when it expires so we can refresh it before cache
        // expiration.
        if (statusCode < 400) {
          commander.zadd(`{users:${userId}}:expiresAt`, now + CACHE_TIME_MS, url);
        }
        commander.exec();
      });
    }
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

/** Renders a `url` if it doesn't exist in the cache. */
async function renderUrl(req: express.Request, url: string): Promise<RenderResponse | null> {
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
    return await render(url, requestHeaders);
  } catch (e: any) {
    console.error('Unable to render URL.', e);
  }
  return null;
}

/** Returns the current 'yyyy-mm'. Used in Redis for bucketing by month. */
function getYyyyMm() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return `${year}-${month < 10 ? '0' : ''}${month}`;
}

/**
 * Given a URL (e.g. "https://api.foony.com/foo/bar"), returns a nice key sorted by TLD, e.g.:
 * "https://com:foony:api/foo/bar"
 */
function urlToKey(url: string): string {
  const {protocol, host, path} = Url.parse(url);

  // `host` will be the domain name + ':port' (if there's a port), so remove the port,
  // reverse the order of the sections, then stick it back together
  const [hostname, port] = (host || '').split(':');
  const reverseHostname = hostname.split('.').reverse().join(':');
  return `${protocol}${reverseHostname}${port ? `:${port}` : ''}${path}`;
}
