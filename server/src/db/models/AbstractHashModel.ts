import Redis from "ioredis";
import {isNil} from "lodash";
import {Keys, Pretty} from "@shared/types/ExtraTypes";

/** An abstract model stores in a Redis hash. */
export abstract class AbstractHashModel<T extends object> {
  protected constructor(
      protected readonly redis: Redis,
      protected readonly collectionId: string,
      private readonly defaultModel: T) {}

  /**
   * Queries a model with the given `id` from the database. If `fields` are provided, only those
   * fields will be returned.
   *
   * Complexity is O(n) where `n` is the number of fields requested.
   * TODO(acorn1010): Fix return type when key / fields are missing.
   */
  async get<K extends Keys<T>>(id: string, ...fields: K[])
      : Promise<keyof T extends K ? T : Pretty<Omit<T, Exclude<keyof T, K>>>> {
    if (fields.length === 0) {
      const result = await this.redis.hgetall(`${this.collectionId}:${id}`);
      return Object.fromEntries(
          Object.entries(result).map(([key, value]) => [key, JSON.parse(value)])) as any;
    }

    const result = await this.redis.hmget(`${this.collectionId}:${id}`, ...fields);
    return Object.fromEntries(
        result.map((value, idx) => [fields[idx], isNil(value) ? this.defaultModel[fields[idx]] : JSON.parse(value)])
    ) as any;
  }

  /**
   * Queries a model for the given `ids` from the database. If `fields` are provided, only those
   * fields will be returned.
   *
   * Complexity is O(n * m) where `n` is the number of fields requested and `m` is the number of `ids`.
   */
  async getMany<K extends Keys<T>>(ids: string[], ...fields: K[])
      : Promise<(keyof T extends K ? T : Pretty<Omit<T, Exclude<keyof T, K>>>)[]> {
    return Promise.all(ids.map(id => this.get(id, ...fields)));
  }

  /** Updates a model with `id`, setting all field `values`. */
  async update(id: string, values: Partial<T>): Promise<void> {
    this.redis.hmset(`${this.collectionId}:${id}`, Object.entries(values).flat());
  }

  /** Creates a new `model` in the database, returning its id. */
  async create(model: T): Promise<number> {
    const id = await this.redis.incr(`${this.collectionId}_:id`);
    await this.redis.hmset(`${this.collectionId}:${id}`, Object.entries(model).flat());
    return id;
  }
}
