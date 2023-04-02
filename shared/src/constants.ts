/**
 * Production feature flags. If true, these flags will be enabled on the server during deployments.
 * Most of these should be set to false. Once a feature flag has been `true` for a while (e.g. a
 * few weeks), it should be removed.
 */
const PROD_FEATURE_FLAGS = {
} as const;

/**
 * Dev feature flags. These flags will show up during local development. Add your flag here so you
 * can see your changes as you're developing a feature.
 */
const DEV_FEATURE_FLAGS = {
} as const;

/**
 * Feature flags. These allow development of a feature while keeping it disabled in the client and
 * server. Feature flags should be removed once the feature is fully implemented and live.
 */
export const FEATURE_FLAGS = process.env.NODE_ENV === 'development' ? DEV_FEATURE_FLAGS : PROD_FEATURE_FLAGS;
