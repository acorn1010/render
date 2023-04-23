import {Actions} from 'shared/Action';
import {useEffect} from "react";
import {authStore} from "@/auth/authStore";
import {createGlobalStore} from "@/state/createGlobalStore";
import {Multiset} from "shared/collections/Multiset";

type CallArgs<T extends keyof Actions> = Actions[T]['input'] extends any[]
    ? Actions[T]['input']
    : {} extends Actions[T]['input'] ? [] : [Actions[T]['input']];

/**
 * Interval in milliseconds of long-polling. Determines how frequently data is polled from the
 * server, where lower values mean more frequent polling.
 */
const LONG_POLL_INTERVAL_MS = 10_000;

const pollStore = createGlobalStore({} as {[key: string]: any});

class PollSingleton {
  /** Maps a JSON.stringify() of action + props -> number of listeners. */
  private readonly refs = new Multiset<string>();

  /**
   * Maps a key (JSON.stringify()) of action + props -> interval timer. Use this when removing a
   * listener.
   */
  private readonly unsubscribePaths = new Map<string, ReturnType<typeof setInterval>>();

  connect<T extends keyof Actions>(action: T, ...args: CallArgs<T>) {
    const key = JSON.stringify([action, ...args]);
    if (this.refs.add(key) !== 1) {
      return;  // Not the first connection. No need to establish a listener.
    }

    // This is the first connection. Set up a long-polling listener.
    const refresh = async () => {
      try {
        // NOTE: It's possible that we've updated the client's state in the time we've started
        // fetching from the server. If so, don't update the local state.
        const oldState = pollStore.get(key);
        const result = await call[action](...args);
        if (oldState === pollStore.get(key)) {
          pollStore.set(key, result);  // State is still the same. It's safe to replace!
        }
      } catch (e) {
        console.error(`Failed to do long poll for ${action} with args: ${args}`, e);
      }
    };
    this.unsubscribePaths.set(key, setInterval(refresh, LONG_POLL_INTERVAL_MS));
    refresh().then(() => {});
  }

  close<T extends keyof Actions>(action: T, ...args: CallArgs<T>) {
    const key = JSON.stringify([action, ...args]);
    if (!this.refs.remove(key)) {
      throw new Error(`Tried to close a connection that was never opened. Did you mutate poll.use args?: ${key}`);
    }
    if (!this.refs.has(key)) {
      clearInterval(this.unsubscribePaths.get(key)!);
    }
  }
}
/** Tracks the open connections, deduping poll requests where necessary. */
const pollSingleton = new PollSingleton();

/**
 * Allows periodic polling of state from the server. This is essentially a "slow" pub/sub without
 * SSE or websockets.
 */
export const poll = {
  /**
   * Updates the long-poll data for `action` with the given `args`. This is a temporary update.
   * After a timeout greater than `LONG_POLL_INTERVAL_MS` (or during the next long-poll), this
   * update will be cleared and replaced with the long-poll data.
   */
  update: <T extends keyof Actions>(action: T, ...args: CallArgs<T>) => (data: Partial<Actions[T]['output']>) => {
    const key = JSON.stringify([action, ...args]);
    const scope: {ref: Partial<Actions[T]['output']>} = {ref: {}};
    pollStore.set(key, prevState => {
      scope.ref = ({...prevState, ...data});
      return scope.ref;
    });
    setTimeout(() => {
      if (scope.ref === pollStore.get(key)) {
        // State is stale and hasn't changed. Delete it!
        pollStore.delete(key);
      }
    }, LONG_POLL_INTERVAL_MS * 1.5);
  },

  /**
   * Periodically polls `action` with the given `args`. Returns `undefined` until the API has had a
   * chance to reply.
   *
   * TODO(acorn1010): Add Multiset so we can support batching in case multiple components need access
   *  to the same endpoint.
   */
  use: <T extends keyof Actions>(action: T, ...args: CallArgs<T>): Actions[T]['output'] | undefined => {
    const key = JSON.stringify([action, ...args]);
    const [result] = pollStore.use(key);

    useEffect(() => {
      pollSingleton.connect(action, ...args);
      return () => {
        setTimeout(() => pollSingleton.close(action, ...args), LONG_POLL_INTERVAL_MS);
      };
    }, [action, ...args]);

    return result;
  },
};

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
  const url = import.meta.env.DEV ? 'http://localhost:3000/api' : 'https://api.rendermy.site/api';
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
