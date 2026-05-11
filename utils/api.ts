/**
 * Central API base URL.
 * - Development (__DEV__ / NODE_ENV !== "production"): local Worker
 * - Production: deployed Worker
 */

const PROD_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
const DEV_URL = "http://localhost:8787";

// __DEV__ is available in React Native / Expo; fall back to NODE_ENV for web
const isDev =
  typeof __DEV__ !== "undefined"
    ? __DEV__
    : process.env.NODE_ENV !== "production";

export const API_BASE = isDev ? DEV_URL : PROD_URL;

console.log(`[api] base URL → ${API_BASE}`);
