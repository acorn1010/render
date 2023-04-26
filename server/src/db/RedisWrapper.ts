import Redis from "ioredis";
import {UserModel} from "./models/UserModel";
import {UrlModel} from "./models/UrlModel";
import {LockModel} from "@server/db/models/LockModel";

// NOTE: We separate the internal and external classes because we don't want to expose the internal
// model interfaces. This is because the internal interfaces are more specific, and we want to be
// able to change them without breaking the external interface.
abstract class RedisWrapperInternal {
  protected constructor(
      redis: Redis,

      /** Provides an interface for interacting with URLs for a user. */
      readonly url = new UrlModel(redis),

      /** Provides an interface for getting / setting a User's profile / config information. */
      readonly user = new UserModel(redis),

      /** Provides a locking mechanism for workers. */
      readonly lock = new LockModel(redis),
  ) {}
}

export class RedisWrapper extends RedisWrapperInternal {
  constructor(redis: Redis) {
    super(redis);
  }
}
