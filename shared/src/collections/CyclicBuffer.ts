/**
 * A cyclic buffer that provides iteration of its values.
 *
 * NOTE: The buffer can keep around old memory. Be VERY careful when using this with large objects,
 * as a reference to those objects may persist past the expected lifecycle.
 */
export class CyclicBuffer<T> {
  private readonly buffer: Array<T>;

  /** Index into buffer. This is one past the 0-based value of the last item added to the buffer. */
  private index = 0;

  /** Number of elements currently in the cyclic buffer. */
  public length = 0;

  /** Creates a cyclic buffer with `size` elements in it. */
  constructor(size: number) {
    this.buffer = new Array(size);
  }

  /** Sets the length of the buffer to 0. Does NOT remove references to objects! */
  clear() {
    this.length = 0;
  }

  /** Pops the newest value from the buffer, if any. Else returns undefined. */
  popBack(): T | undefined {
    if (this.length <= 0) {
      return undefined;
    }
    if (this.index <= 0) {
      this.index = this.buffer.length;
    }
    --this.length;
    return this.buffer[--this.index];
  }

  /** Pops the oldest value from the buffer, if any. Else returns undefined. */
  popFront(): T | undefined {
    if (this.length <= 0) {
      return undefined;
    }
    let index = this.index - this.length--;
    if (index < 0) {
      index += this.buffer.length;
    }
    return this.buffer[index];
  }

  /** Pushes `values` onto the buffer at the back. */
  pushBack(...values: T[]) {
    for (const value of (values)) {
      this.length = Math.min(this.length + 1, this.buffer.length);
      this.buffer[this.index++] = value;
      // Reset index if it's too high.
      if (this.index >= this.buffer.length) {
        this.index = 0;
      }
    }
  }

  /**
   * Returns values from most-recently-added to least-recent. Does not modify the buffer.
   * See Array#slice.
   */
  slice(start: number, end?: number) {
    const result: T[] = [];

    start = start < 0 ? this.buffer.length + start : start;
    end = end ?? this.buffer.length;
    end = end !== undefined && end < 0 ? this.buffer.length + end : end;
    const length = end - start;
    const index = (this.index - start) % this.buffer.length;
    result.push(...this.buffer.slice(Math.max(0, index - length), index).reverse());
    result.push(...this.buffer.slice(this.buffer.length - (length - index)).reverse());
    return result;
  }

  /** Returns values in the buffer from newest to oldest. */
  [Symbol.iterator](): Iterator<T> {
    const that = this;
    let currentIndex = this.index;
    let count = 0;

    return {
      next(): IteratorResult<T> {
        if (currentIndex <= 0) {
          currentIndex = that.buffer.length;
        }
        const value = that.buffer[--currentIndex];
        return {done: count++ === that.buffer.length, value};
      }
    };
  }
}
