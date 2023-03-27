import {createGlobalStore} from "@/state/createGlobalStore";
import {type Auth, type User, type AuthProvider, signOut, getAuth, GithubAuthProvider, GoogleAuthProvider, signInWithPopup} from "firebase/auth";
import {useEffect} from "react";
import {app} from "@/services/firebase";

/** In order to use authStore, you must include #useAuth higher in the DOM. */
export const authStore = createGlobalStore({
  /**
   * userId starts as undefined. If there's no logged-in user, this will be null. It's only
   * undefined while loading.
   */
  userId: undefined as string | undefined | null,
  email: undefined as string | undefined | null,
  displayName: undefined as string | undefined | null,

  /** URL to this user's photo, if any (e.g. "https://foony.com/foony.png") */
  photoUrl: undefined as string | undefined | null,
});

let auth: Auth | null = null;
/** Initializes auth if it hasn't already been initialized. Must be included if using authStore. */
export function useAuth() {
  useEffect(() => {
    if (!auth) {
      auth = getAuth(app);
    }
    auth.onAuthStateChanged((user) => updateStore(user));
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

function updateStore(user: User | null) {
  authStore.update({
    userId: user?.uid ?? null,
    email: user?.email ?? null,
    displayName: user?.displayName ?? null,
    photoUrl: user?.photoURL ?? null,
  });
}
