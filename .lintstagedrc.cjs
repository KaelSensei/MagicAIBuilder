/** @type {import('lint-staged').Config} */
module.exports = {
  // Use `next lint --fix --file <f>` so Next.js resolves .eslintrc.json correctly.
  // Running `eslint --fix` directly fails under ESLint v9 flat-config mode.
  "*.{ts,tsx}": (filenames) =>
    `next lint --fix ${filenames.map((f) => `--file "${f}"`).join(" ")}`,
  "*.{json,md,yml,yaml}": "prettier --write",
};
