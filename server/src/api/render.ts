import {RenderResponse} from "../db/models/UrlModel";
import {env} from "../Environment";
import {render} from "../browsers/ChromeBrowser";
import {FastifyReply, FastifyRequest} from "fastify";
import {HttpsError} from "../http/HttpsError";
import {getUserId} from "../http/AuthUtils";
import {CallableContext} from "../http/CallableContext";

// Don't include some problematic headers from the original third-party response. We're using our
// own content-encoding, we don't support keep-alive connections, and we don't do chunked encoding.
const HEADER_BLACK_LIST = new Set(['transfer-encoding', 'connection', 'content-encoding']);

export async function doRequest(req: FastifyRequest, res: FastifyReply, context: CallableContext) {
  let url = req.url.slice('/'.length);
  if (!url || !url.match(/^https?:\/\//)) {
    throw new HttpsError('failed-precondition', `Invalid URL "${req.url}". Example request: https://api.rendermy.site/https://foony.com`);
  }

  // If this is not a full URL, then base the URL off of where it's requested from. This isn't
  // really necessary and could be deleted without affecting the service. It's more for local
  // development.
  if (url.indexOf('://') < 0) {
    const referer = req.headers.referer || '';
    // From https://www.rfc-editor.org/rfc/rfc3986#page-51.
    // Given a referer of e.g. http://localhost:3000/https://example.com/foo/bar,
    // returns http://localhost:3000/https://example.com
    const baseReferer = referer.match(/((?:([^:\/?#]+):)?\/\/([^\/?#]*)\/(?:([^:\/?#]+):)?\/\/([^\/?#]*)).*/)?.[1];
    url = (baseReferer ?? referer) + '/' + url;
  }
  console.log('Navigating to URL', url);

  const userId = getUserId(context);
  let response: RenderResponse | null = null;
  const cachedResult = await env.redis.url.queryPage({
    url, userAgent: req.headers['user-agent'], userId
  });
  if (cachedResult) {
    response = cachedResult;
    // TODO(acorn1010): Remove after 2023-05-01
    response.headers ||= (response as any).responseHeaders;
    response.console ||= [];
  }

  // TODO(acorn1010): Instead of trying to render this directly, stick it in a worker queue
  //  and wait for it to be finished. This will reduce API flakiness.
  if (!response) {
    console.log(`No cache. Rendering URL: ${url}`);
    response = await renderAndCache(userId, url, getRequestHeaders(req));
  }

  if (!response) {
    throw new HttpsError('failed-precondition', `Invalid URL. Got: "${url}". Example request: "https://api.rendermy.site/https://foony.com".`);
  }

  // For each header in the actual response, set them
  for (const [key, value] of Object.entries(response.headers)) {
    // this would have been easier to write in SQL @matty_twoshoes
    if (!HEADER_BLACK_LIST.has(key.toLowerCase())) {
      res.header(key, value.indexOf('\n') >= 0 ? value.split('\n') : value);
    }
  }
  res.send(response.buffer);
}

function getRequestHeaders(req: FastifyRequest): Record<string, string> {
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
