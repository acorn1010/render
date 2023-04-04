export type CallableContext = {
  /** The authenticated userId, if any. */
  uid?: string,

  /** Type of auth for uid. 'token' is more restricted in what it can access than 'oauth'. */
  authType: 'token' | 'oauth',
};
