/**
 * Adds / removes a friend from the user's friend list. Friends are able to invite
 * each other to games and send private messages.
 */
export type AddFriendOptions = {
  /** The userId to add / remove as a friend. */
  userId: string,

  /** Whether to add or remove the friend. */
  type: 'add' | 'remove',
};
