import {PushId} from "./DbUtils";

/** API token used for authorizing with the backend */
type ApiToken = string;
type UserId = PushId;

type User = {};

export type RenderResponse = {
  responseHeaders: Record<string, string>,
  /** Response status code (e.g. 200 for success) */
  statusCode: 200 | 404 | number,
  /** The HTML / binary content of this page */
  buffer: Uint8Array,
};

/**
 * URIs cached for users by their userId. Format is `userUris:userId` -> URI -> data.
 * URI should be of the form: "https://example.com/aoe?b=1".
 */
type UserUris = Record<`userUris:${string}`, Record<string, RenderResponse>>;

/** The database schema. Define new collections here. */
export type Schema = {
  /** NOTE: Collections _MUST_ end in an 's' */
  collections: {
    users: {[userId in UserId]: User},
    tokens: {[token in ApiToken]: UserId},
  } & UserUris,
};
