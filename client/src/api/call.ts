import {Actions} from 'render-shared-library/lib/Action';

type CallArgs<T extends keyof Actions> = Actions[T]['input'] extends any[]
    ? Actions[T]['input']
    : {} extends Actions[T]['input'] ? [] : [Actions[T]['input']];

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
  return await response.json() as Actions[T]['output'];
}
