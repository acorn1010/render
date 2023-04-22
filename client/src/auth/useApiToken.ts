import {call, poll} from "@/api/call";
import {useEffect} from "react";
import {isLoaded} from "@/state/isLoaded";

/**
 * Returns the user's API token. If the user doesn't have an API token, calls the server and
 * requests one.
 */
export function useApiToken() {
  const profile = poll.use('getProfile');
  // TODO(acorn1010): Maybe request a new token when the user is created on the server.

  const isProfileLoaded = isLoaded(profile);
  const token = profile?.token;
  useEffect(() => {
    if (!isProfileLoaded || token) {
      return;
    }
    (async () => {
      // If profile is loaded and the user doesn't have a token, refresh their token
      const token = await call.refreshToken();
      if (token) {
        poll.update('getProfile')({token});
      }
    })();
  }, [isProfileLoaded, token]);

  return profile?.token ?? '';
}
