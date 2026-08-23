/**
 * Where `auth.setup.ts` writes the signed-in browser state, and where the
 * `authenticated` project reads it from.
 *
 * It lives in its own module because `playwright.config.ts` needs the path:
 * importing it from the setup file would load that file while the config is
 * being read, and calling `setup()` outside a test run is an error.
 *
 * Gitignored — it holds a real session cookie, short-lived and local, but a
 * session cookie all the same.
 */
export const STORAGE_STATE = "playwright/.auth/user.json";
