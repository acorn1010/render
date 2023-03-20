import Redis from "ioredis";
import {UserModel} from "./models/UserModel";
import {UrlModel} from "./models/UrlModel";

export class RedisWrapper {
  /** Provides an interface for interacting with URLs for a user. */
  readonly url: UrlModel;

  /** Provides an interface for getting / setting a User's profile / config information. */
  readonly user: UserModel;

  constructor(redis: Redis) {
    this.url = new UrlModel(redis);
    this.user = new UserModel(redis);
  }
}
