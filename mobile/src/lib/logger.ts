/**
 * Tiny logger — `debug`/`info` are stripped in production builds,
 * `warn`/`error` always surface. Replaces scattered `console.log`.
 */

// eslint-disable-next-line no-console
const noop = () => undefined;

export const logger = {
  debug: (...args: unknown[]) => {
    if (__DEV__) console.log(...args);
  },
  info: (...args: unknown[]) => {
    if (__DEV__) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(...args);
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  noop,
};
