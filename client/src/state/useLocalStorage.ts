import {useCallback, useEffect} from "react";
import {createGlobalStore} from "@/state/createGlobalStore";

const store = createGlobalStore({} as {[key: string]: any});

/**
 * Listens on changes to a `key` in localStorage. Returns the value of the key
 * @param key the key to listen to
 * @param initialValue the initial value to use if the key doesn't exist in localStorage
 */
export function useLocalStorage<T>(key: string, initialValue?: T)
    : [T, (value: T | ((prevValue: T) => T)) => void] {
  const [result, setResult] = store.use(key);
  const storedValue = result ?? getLocalStorage<T>(key) ?? (initialValue ?? null);

  // Set store if we had localStorage or an initial value that hasn't been set yet.
  useEffect(() => {
    if (result === undefined && storedValue !== result) {
      setResult(storedValue);
    }
  }, [result, storedValue, setResult]);

  const setResultWrapper = useCallback((newValue: T | ((prevValue: T) => T)) => {
    // Allow value to be a function so we have the same API as useState
    const valueToStore = newValue instanceof Function ? newValue(store.get(key)) : newValue;
    // Save state
    setLocalStorage(key, valueToStore);
  }, [key]);

  return [storedValue, setResultWrapper];
}

/**
 * Retrieves a value from local storage. Doesn't trigger any React state changes.
 * @param key the key to get
 */
export function getLocalStorage<T>(key: string): T | null {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Failed to get from local storage.', key, error);
    return null;
  }
}

/**
 * Sets a value in local storage.
 * @param key the key to set
 * @param value the value to set at location "key"
 */
export function setLocalStorage<T>(key: string, value: T) {
  try {
    store.set(key, value);
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to set local storage.', key, value, error);
  }
}
