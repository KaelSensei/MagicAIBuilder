/** @type {import('lint-staged').Config} */
module.exports = {
  // ESLint reads eslint.config.mjs. --no-warn-ignored keeps a staged file that
  // the config ignores (src/generated) from printing a warning.
  "*.{ts,tsx}": "eslint --fix --no-warn-ignored",
  "*.{json,md,yml,yaml}": "prettier --write",
};
