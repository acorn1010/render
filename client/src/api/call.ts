import {Actions} from 'render-shared-library/lib/Action';
import {useEffect, useState} from "react";
import {authStore} from "@/auth/authStore";

type CallArgs<T extends keyof Actions> = Actions[T]['input'] extends any[]
    ? Actions[T]['input']
    : {} extends Actions[T]['input'] ? [] : [Actions[T]['input']];

/**
 * Periodically polls `action` with the given `args`. Returns `undefined` until the API has had a
 * chance to reply.
 *
 * TODO(acorn1010): Add Multiset so we can support batching in case multiple components need access
 *  to the same endpoint.
 */
export function useLongPoll<T extends keyof Actions>(action: T, ...args: CallArgs<T>):
    Actions[T]['output'] | undefined {
  const [result, setResult] = useState<Actions[T]['output'] | undefined>(undefined);

  useEffect(() => {
    const refresh = async () => {
      try {
        setResult(await call[action](...args));
      } catch (e) {
        console.error(`Failed to do long poll for ${action} with args: ${args}`, e);
      }
    };
    const timer = setInterval(refresh, 10_000);

    return () => {
      clearInterval(timer);
    };
  }, [action, ...args]);

  return result;
}

/**
 * Calls the server API. The call will be directed to the server for a room if the player is in a
 * room. Otherwise, the call will be load-balanced and will hit any server.
 */
export const call: {[K in keyof Actions]: (...args: CallArgs<K>) => Promise<Actions[K]['output']>} =
    new Proxy({}, {
      get: <K extends keyof Actions>(_: unknown, key: K) => {
        return (...args: CallArgs<K>) => _call(key, ...args);
      },
    }) as any;

async function _call<T extends keyof Actions>(
    action: T, ...args: CallArgs<T>): Promise<Actions[T]['output']> {
  const url = import.meta.env.DEV ? 'http://localhost:3000/api' : 'https://seorender.site/api';
  authToken = await queryAuthToken();
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({a: action, d: args ?? null}),
    headers: authToken ? {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    } : {},
  });
  // API returns JSON with 'd' for data, and 'e' for error on success
  const result = await response.json() as {d: any, e: string};
  if (result.e) {  // This was an error
    throw new Error(result.e);
  }
  return result.d as Actions[T]['output'];
}

/** The last JWT auth bearer token that was found. Updated when calling room. */
let authToken = '';

/** Waits for an auth token to be available, then sets the authToken. */
function queryAuthToken(): Promise<string> {
  return new Promise<string>(async (resolve) => {
    do {
      const user = authStore.get('user');
      // Always requery the authToken. This ensures our token doesn't go stale.
      authToken = await user?.getIdToken() || authToken;
      if (!authToken) {
        // Wait a bit between requests.
        await new Promise(resolve2 => setTimeout(resolve2, 50));
      }
    } while (!authToken);
    resolve(authToken);
  });
}
