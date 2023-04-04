import admin from "firebase-admin";
import NodeCache from "node-cache";
import {HttpsError} from "./HttpsError";
import {CallableContext} from "./CallableContext";

function assertAuthenticated(context: CallableContext): asserts context is Omit<CallableContext, 'uid'> & {uid: string} {
  if (!context.uid) {
    throw new HttpsError('failed-precondition', 'This endpoint must be called while authenticated.');
  }
}

/** Returns the user id of the authorized user in "context", else throws an HttpsError. */
export function getUserId(context: CallableContext) {
  assertAuthenticated(context);
  return context.uid;
}

const tokenCache = new NodeCache({stdTTL: 60 * 60, useClones: false});
/**
 * Attempts to very quickly verify an idToken. This should always be done before awaiting on
 * verifyIdToken for performance reasons.
 *
 * Note that this _does_ currently allow expired tokens (up to 60 minutes expired). But whatever.
 */
export function verifyIdTokenFromCache(token: string) {
  const result = tokenCache.get<admin.auth.DecodedIdToken | HttpsError>(token);
  if (result instanceof HttpsError) {
    throw result;
  }
  return result;
}

/**
 * Verifies a Firebase JWT auth token.
 * TODO(acorn1010): auth.verifyIdToken() used to be slow. If we have issues, borrow fast version from Foony.
 * @param token a JWT token to verify.
 * @returns verified user or throws HttpsError on unauthenticated.
 */
export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
  const result = await admin.auth().verifyIdToken(token);
  tokenCache.set(token, result);
  return result;
}
