/** Helper type to flatten complex types. */
export type Pretty<T> = T extends infer U ? {[K in keyof U]: U[K]} : never;
