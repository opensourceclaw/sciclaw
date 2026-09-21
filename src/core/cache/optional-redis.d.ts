/**
 * Ambient declarations for the optional Redis driver modules used by
 * cache/distributed.ts — loaded via dynamic `import()` in a try/catch
 * fallback chain, so absence at runtime is already handled (`connect()`
 * returns false). These stubs keep tsc green when neither driver is
 * installed; the core source itself is untouched.
 *
 * Merged from deepclaw-core, 2026-09-21.
 */

declare module "ioredis" {
  const Redis: any;
  export default Redis;
  export const Redis: any;
}

declare module "redis" {
  const Redis: any;
  export default Redis;
  export const Redis: any;
}
