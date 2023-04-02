/** A two-way Map that allows O(1) lookups by both key and by value. */
export class BiMap<K, V> {
  private readonly keysToValues = new Map<K, V>()
  private readonly valuesToKeys = new Map<V, K>();

  /** Returns the `value` for the given `key`. */
  get(key: K) {
    return this.keysToValues.get(key);
  }

  /** Returns the `key` matching `value` if `value` was in the BiMap. */
  getByValue(value: V) {
    return this.valuesToKeys.get(value);
  }

  /** Returns `true` if `key` was deleted from the BiMap. */
  delete(key: K): boolean {
    if (!this.keysToValues.has(key)) {
      return false;
    }
    this.valuesToKeys.delete(this.get(key)!);
    this.keysToValues.delete(key);
    return true;
  }

  /** Returns `true` if `value` was deleted from the BiMap. */
  deleteByValue(value: V): boolean {
    if (!this.valuesToKeys.has(value)) {
      return false;
    }
    this.valuesToKeys.delete(value);
    this.keysToValues.delete(this.getByValue(value)!);
    return true;
  }

  set(key: K, value: V) {
    this.keysToValues.set(key, value);
    this.valuesToKeys.set(value, key);
  }
}
