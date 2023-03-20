import {createGlobalStore} from "../state/createGlobalStore";
import {type Auth, type User, type AuthProvider, getAuth, GithubAuthProvider, GoogleAuthProvider, signInWithPopup} from "firebase/auth";
import {useEffect} from "react";
import {app} from "../services/firebase";

/** In order to use authStore, you must include #useAuth higher in the DOM. */
export const authStore = createGlobalStore({
  userId: undefined as string | undefined,
  email: undefined as string | undefined,
  displayName: undefined as string | undefined,

  /** URL to this user's photo, if any (e.g. "https://foony.com/foony.png") */
  photoUrl: undefined as string | undefined,
});

let auth: Auth | null = null;
/** Initializes auth if it hasn't already been initialized. Must be included if using authStore. */
export function useAuth() {
  useEffect(() => {
    if (!auth) {
      auth = getAuth(app);
      auth.onAuthStateChanged((user) => updateStore(user));
    }
  }, []);
}

const PROVIDERS = {
  google: () => new GoogleAuthProvider(),
  github: () => new GithubAuthProvider(),
} as const satisfies {[provider: string]: () => AuthProvider};

/** Opens a popup that allows the user to sign in with the given provider. */
export async function signInWithProvider(providerKey: keyof typeof PROVIDERS): Promise<void> {
  try {
    const result = await signInWithPopup(getAuth(), PROVIDERS[providerKey]());
    updateStore(result.user);
  } catch (e) {
    console.error('Error signing in!', e);
  }
}

function updateStore(user: User | null) {
  authStore.update({
    userId: user?.uid,
    email: user?.email ?? undefined,
    displayName: user?.displayName ?? undefined,
    photoUrl: user?.photoURL ?? undefined,
  });
}
