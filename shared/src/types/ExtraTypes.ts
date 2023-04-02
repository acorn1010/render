/** Makes `T` readonly for all nested properties. */
export type DeepReadonly<T> =
    T extends Function ? T
    : T extends object ? {readonly [key in keyof T]: DeepReadonly<T[key]>}
    : T;
