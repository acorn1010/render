import {createGlobalStore} from "@/state/createGlobalStore";
import {type Auth, type User, type AuthProvider, signOut, getAuth, GithubAuthProvider, GoogleAuthProvider, signInWithPopup} from "firebase/auth";
import {useEffect} from "react";
import {app} from "@/services/firebase";
import {getLocalStorage, setLocalStorage, useLocalStorage} from "@/state/useLocalStorage";
import {isEqual} from "moderndash";

const initialState = {
  user: undefined as Pick<User, 'getIdToken'> | null | undefined,

  /**
   * userId starts as undefined. If there's no logged-in user, this will be null. It's only
   * undefined while loading.
   */
  userId: undefined as string | undefined | null,
  email: undefined as string | undefined | null,
  displayName: undefined as string | undefined | null,

  /** URL to this user's photo, if any (e.g. "https://foony.com/foony.png") */
  photoUrl: undefined as string | undefined | null,
} as const;

/** In order to use authStore, you must include #useAuth higher in the DOM. */
export const authStore = createGlobalStore(initialState);

let auth: Auth | null = null;
/** Initializes auth if it hasn't already been initialized. Must be included if using authStore. */
export function useAuth() {
  // Load the old auth from local storage, if any. Lowers time-to-interactive
  const [oldAuth] = useLocalStorage<Omit<typeof initialState, 'user'> | null>('auth', null);

  // On initial load, set the old auth to the store if it exists.
  useEffect(() => {
    if (!auth && oldAuth) {
      auth = getAuth(app);
      updateStore({
        email: oldAuth.email ?? null,
        displayName: oldAuth.displayName ?? null,
        uid: oldAuth.userId ?? '',
        photoURL: oldAuth.photoUrl ?? null,
        getIdToken(forceRefresh?: boolean): Promise<string> {
          let unsubscribe: () => void = () => {};
          return new Promise<string>((resolve, reject) => {
            if (auth) {
              unsubscribe = auth.onAuthStateChanged(user => resolve(user?.getIdToken(forceRefresh) ?? ''));
            } else {
              reject(new Error('Auth not initialized.'));
            }
          }).finally(unsubscribe);
        },
      });
    }
  }, [oldAuth]);

  useEffect(() => {
    if (!auth) {
      auth = getAuth(app);
    }
    // NOTE: There seems to be a bug with Firestore where onAuthStateChange removes the user from
    //  the store until the callback is called. This means that if you're logged in, and you refresh
    //  while loading, you'll be logged out.
    //  Only happens on Firefox?
    auth.onAuthStateChanged((user) => {
      updateStore(user);
    });
  }, []);
}

/** Logs out the currently-logged-in user. */
export function logout(): Promise<void> {
  if (!auth) {
    auth = getAuth(app);
  }
  return signOut(auth);
}

const PROVIDERS = {
  google: () => new GoogleAuthProvider(),
  github: () => new GithubAuthProvider(),
} as const satisfies {[provider: string]: () => AuthProvider};
export type AuthProviderId = keyof typeof PROVIDERS;

/** Opens a popup that allows the user to sign in with the given provider. */
export async function signInWithProvider(providerKey: AuthProviderId): Promise<void> {
  try {
    const result = await signInWithPopup(getAuth(), PROVIDERS[providerKey]());
    updateStore(result.user);
  } catch (e) {
    console.error('Error signing in!', e);
  }
}

function updateStore(user: Pick<User, 'uid' | 'email' | 'displayName' | 'photoURL' | 'getIdToken'> | null) {
  const sharedState = {
    userId: user?.uid ?? null,
    email: user?.email ?? null,
    displayName: user?.displayName ?? null,
    photoUrl: user?.photoURL ?? null,
  } as const;
  if (!isEqual(getLocalStorage('auth'), sharedState)) {
    setLocalStorage<Omit<typeof initialState, 'user'>>('auth', sharedState);
  }
  authStore.update({user, ...sharedState});
}
