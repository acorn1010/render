import {User} from "./models/User";

/**
 * Actions that can be sent to the server via the server API #call function. The value follows a
 * special namespacing format. Before the first _ is the functions/src/actions/ filename that will
 * have its #run method be executed. After that, the rest is action-specific. For example, game
 * actions are of the form "GameAction_{gameId}_{methodName}".
 */
export type Actions = MakeActions<{
  /** Flushes the domains of the user. */
  flush: {input: [], output: boolean},

  /** Returns the page renders done by month for the user. */
  getMonthlyRenderCounts: {input: [], output: {month: string, renderCount: number}[]},

  /** Retrieves information about a user's profile. */
  getProfile: {input: [], output: User},

  /** Refreshes a user's API key, returning their new API key. */
  refreshToken: {input: [], output: string},
}>;
export type Action = keyof Actions;
/** This type is required by ts-json-schema so we can generate proper  */
export type ActionInputs = {[K in keyof Actions]: Actions[K]['input']};

/** Validates Action type and ensures everything follows the correct format. */
type MakeActions<T extends {[key: string]: {input: {[key: string]: any}, output: any}}> = T;
