// Note: Consider using a whitelist here instead: future API changes could
//  introduce mutable methods that allow changing the values in Set.
type ImmutableSet<T extends any> = Omit<Set<T>, 'add' | 'delete' | 'clear'>;

/**
 * A bi-directional Multimap. Multimaps are similar to maps, but store a set of values for a given
 * key. A bi-directional Multimap, then, allows you to retrieve all keys for a given `value`, or all
 * values from a given `key`.
 */
export class BiMultimap<K, V> {
  private readonly keys = new Map<K, Set<V>>();
  private readonly values = new Map<V, Set<K>>();

  /** Returns true if `key` is in this multimap. */
  has(key: K): boolean {
    return this.keys.has(key);
  }

  /** Returns the `value` for the given `key`. */
  get(key: K): ImmutableSet<V> | undefined {
    return this.keys.get(key);
  }

  /** Returns the `key` matching `value` if `value` was in the BiMultimap. */
  getByValue(value: V): ImmutableSet<K> | undefined {
    return this.values.get(value);
  }

  /** Removes a key-value pair from the multimap, returning `true` if a pair was deleted. */
  delete(key: K, value: V): boolean {
    const result = !!this.keys.get(key)?.has(value);
    this.keys.get(key)?.delete(value);
    this.values.get(value)?.delete(key);
    return result;
  }

  /** Returns `true` if `key` was deleted from the BiMultimap. */
  deleteByKey(key: K): boolean {
    if (!this.keys.has(key)) {
      return false;
    }
    // Delete from `values` all references to `key`
    for (const value of this.get(key) || []) {
      const valueKeys = this.values.get(value);
      if (!valueKeys) {
        continue;
      }
      for (const valueKey of valueKeys) {
        valueKeys.delete(valueKey);
      }
      if (valueKeys.size <= 0) {
        this.values.delete(value);
      }
    }
    this.keys.delete(key);
    return true;
  }

  /** Returns `true` if `value` was deleted from the BiMultimap. */
  deleteByValue(value: V): boolean {
    if (!this.values.has(value)) {
      return false;
    }
    // Delete from `keys` all references to `value`
    for (const key of this.getByValue(value) || []) {
      const keyValues = this.keys.get(key);
      if (!keyValues) {
        continue;
      }
      for (const keyValue of keyValues) {
        keyValues.delete(keyValue);
      }
      if (keyValues.size <= 0) {
        this.keys.delete(key);
      }
    }
    this.values.delete(value);
    return true;
  }

  /**
   * Adds `key`, `value` to the multimap, returning `true` if it was added or
   * false if the key-value pair already existed.
   */
  set(key: K, value: V): boolean {
    if (!this.keys.has(key)) {
      this.keys.set(key, new Set());
    }
    if (!this.values.has(value)) {
      this.values.set(value, new Set());
    }
    const result = !this.keys.get(key)!.has(value);
    this.keys.get(key)!.add(value);
    this.values.get(value)!.add(key);
    return result;
  }
}
