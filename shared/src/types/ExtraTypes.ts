/** Makes `T` readonly for all nested properties. */
export type DeepReadonly<T> =
    T extends Function ? T
    : T extends object ? {readonly [key in keyof T]: DeepReadonly<T[key]>}
    : T;

/** Helper type to flatten complex types. */
export type Pretty<T> = T extends infer U ? {[K in keyof U]: U[K]} : never;

/** Limits keyof T to extending just string. Sometimes needed so we don't have a string | number | symbol union. */
export type Keys<T> = Extract<keyof T, string>;
