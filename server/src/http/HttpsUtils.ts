import {CallableContext} from "./CallableContext";
import {verifyIdToken, verifyIdTokenFromCache } from "./AuthUtils";
import {HttpsError} from "./HttpsError";
import {FastifyReply, FastifyRequest} from "fastify";
import {env} from "../Environment";

/**
 * Attempts to retrieve the authorization context from the provided `authorization` header. The
 * `authorization` header should be of the form "Bearer jwtTokenHere". If it
 * doesn't start with 'Bearer ', then it's assumed to be 'jwtTokenHere' instead.
 */
export async function getAuthContext(authorization: string): Promise<CallableContext> {
  const [, idToken] = (authorization || '').match(/^Bearer (.*)$/) || [null, authorization];
  if (!idToken) {
    // noinspection ExceptionCaughtLocallyJS This is how Firebase does it.
    throw new HttpsError('unauthenticated', 'Unauthenticated. No Bearer token.');
  }
  try {
    const token = verifyIdTokenFromCache(idToken) || await verifyIdToken(idToken);
    return {uid: token.uid, authType: 'oauth'};
  } catch (err) {
    console.warn('Failed to authenticate request.');
    // noinspection ExceptionCaughtLocallyJS This is how Firebase does it.
    throw new HttpsError('unauthenticated', 'Unauthenticated');
  }
}

type Request = FastifyRequest<{
  Params: {token?: string},
  Headers: {['x-prerender-token']?: string},
}>;
/** Creates a wrapped Fastify request that performs user validation and handles errors. */
export const makeWrappedRequest = (callback: (req: FastifyRequest<any>, res: FastifyReply, context: CallableContext) => any) =>
    async (req: Request, res: FastifyReply) => {
      const token: string | any = req.headers['x-prerender-token'] || req.params.token;
      let context: CallableContext = {uid: undefined, authType: 'token'};
      if (typeof token === 'string') {
        context.uid = (await env.redis.user.getUserIdByToken(token)) ?? undefined;
        if (!context.uid) {
          throw new HttpsError('unauthenticated', 'Bad API token.');
        }
      }

      const authorization = req.headers.authorization;
      if (authorization) {
        context = await getAuthContext(authorization);
        if (!context.uid) {
          console.log(`Bad bearer token: ${authorization}`);
          throw new HttpsError('unauthenticated', 'Bad Bearer token');
        }
      }

      try {
        await callback(req, res, context);
      } catch (e: any) {
        let err = e;
        if (!(err instanceof HttpsError)) {
          console.error('Failed to run API call.', req.body, e);
          err = new HttpsError('internal', 'INTERNAL');
        }
        console.error('Error during request.', err.toJson());
        res.status(err.getHttpErrorCode()).send(JSON.stringify({e: err.toJson()}));
      }
    };
