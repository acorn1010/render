import {Actions} from 'render-shared-library/lib/Action';
import {useEffect, useState} from "react";

type CallArgs<T extends keyof Actions> = Actions[T]['input'] extends any[]
    ? Actions[T]['input']
    : {} extends Actions[T]['input'] ? [] : [Actions[T]['input']];

/**
 * Periodically polls `action` with the given `args`. Returns `undefined` until the API has had a
 * chance to reply.
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
  }, []);

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
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({a: action, d: args ?? null}),
  });
  // API returns JSON with 'd' for data, and 'e' for error on success
  const result = await response.json() as {d: any, e: string};
  if (result.e) {  // This was an error
    throw new Error(result.e);
  }
  return result.d as Actions[T]['output'];
}
