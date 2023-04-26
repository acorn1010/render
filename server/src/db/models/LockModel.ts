import Redis from "ioredis";
import {nanoid} from "nanoid";

/** A unique id for this process. Ensures that we don't conflict with other worker processes. */
const uuid = nanoid();

export class LockModel {
  constructor(private readonly redis: Redis) {}

  /**
   * Attempts to acquire a lock for `key` for `expirationMs` milliseconds, returning `true` on
   * success.
   */
  async acquireLock(key: string, expirationMs: number) {
    const ref = `workers:${key}`;
    const result = await this.redis.set(ref, uuid, 'NX' as any, 'PX' as any, expirationMs as any);
    return result === 'OK';
  }

  /** Removes a lock with the given `key` that was acquired by #acquireLock earlier. */
  async removeLock(key: string) {
    this.redis.del(`workers:${key}`);
  }
}
