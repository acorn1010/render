#!/usr/bin/env zx

/**
 * A FILO (First-In Last-Out) fetcher that limits the number of concurrent
 * fetches.
 */
class BatchedFetcher {
  /**
   * The maximum number of outstanding requests that can be simultaneously
   * processed.
   */
  maxRequests;

  /** Set of outstanding request promises. */
  outstandingRequests = new Set();

  constructor({maxRequests}) {
    if (maxRequests < 1) {
      throw new Error(`Invalid maxRequests (must be >= 1): ${maxRequests}`);
    }
    this.maxRequests = maxRequests;
  }

  /**
   * Returns the result of fetching `url`. Won't return until the fetcher has
   * had time to process this request, which could be a while if there are more
   * `outstandingRequests` than `maxRequests`.
   */
  async fetch(url) {
    // TODO(acorn1010): May have performance issues when outstandingRequests
    //  greatly exceeds maxRequests.
    while (this.outstandingRequests.size >= this.maxRequests) {
      await Promise.any(this.outstandingRequests);
    }
    const promise = fetch(url);
    this.outstandingRequests.add(promise);
    promise.finally(() => {
      this.outstandingRequests.delete(promise);
    });
    return promise;
  }
}

function generateRandomString() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length: 5}, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

const fetcher = new BatchedFetcher({maxRequests: 30});
const start = Date.now();
const promises = [];
const cacheBuster = generateRandomString();
for (let i = 0; i < 1_000; ++i) {
  const url = `https://render.acorn1010.com/https://foony.com/404_${cacheBuster}_${i}`;
  promises.push(fetcher.fetch(url).then(async (response) => {
    const size = (await response.blob()).size;
    console.log(url, size);
  }));
}

const result = await Promise.all(promises);
const ms = Date.now() - start;
console.log(`Took ${ms} ms, or ${ms / promises.length} ms average`);

console.log(result);
