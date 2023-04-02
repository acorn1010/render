/** A set that can have multiple entries of the same value. Thanks, ChatGPT! */
export class Multiset<T> {
  private readonly elements = new Map<T, number>();
  /** Total number of elements in the Multiset. */
  private _size = 0;

  /** Returns the number of elements in the set after adding `element`. */
  add(element: T): number {
    const count = 1 + (this.elements.get(element) || 0);
    this.elements.set(element, count);
    ++this._size;
    return count;
  }

  /** Returns `true` if the element was removed from the set. */
  remove(element: T): boolean {
    const currentCount = this.elements.get(element) || 0;
    if (currentCount < 1) {
      return false;
    }
    --this._size;
    if (currentCount === 1) {
      this.elements.delete(element);
    } else {
      this.elements.set(element, currentCount - 1);
    }
    return true;
  }

  /** Returns `true` if `element` is in the Multiset */
  has(element: T): boolean {
    return this.elements.has(element);
  }

  /**
   * Returns the total number of elements in the Multiset (e.g. adding the same key 3 times counts
   * as 3 elements).
   */
  size() {
    return this._size;
  }

  /** Returns an iterator over the values in the Multiset. */
  *[Symbol.iterator](): Iterator<T> {
    for (const value of this.elements.keys()) {
      yield value;
    }
  }
}
