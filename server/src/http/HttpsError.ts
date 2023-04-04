
const TYPE_TO_STATUS_CODE = {
  /** User isn't authenticated (bad login). */
  'unauthenticated': 401,

  /**
   * User is authenticated, but not allowed to access this content (e.g. "user" trying to access
   * "admin" console).
   */
  'forbidden': 403,

  /** User provided bad input data. */
  'failed-precondition': 412,

  /** Internal server error. Happens if an exception is unexpectedly thrown. */
  'internal': 500,
} as const;

export class HttpsError extends Error {
  constructor(private readonly type: keyof typeof TYPE_TO_STATUS_CODE, message: string) {
    super(message);
  }

  getHttpErrorCode() {
    return TYPE_TO_STATUS_CODE[this.type];
  }

  toJson() {
    return `${this.type}: ${this.message}`;
  }
}
