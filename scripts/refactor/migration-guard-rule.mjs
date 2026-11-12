// @ts-check
/**
 * The migration guard's ESLint rule, `migration-guard/no-shim-import`: no
 * source may import or mock a path that the move map keeps as a temporary
 * re-export shim (decision D8).
 *
 * Why: a branch that predates a move can still name the old path. An import
 * keeps working through the shim, but a `vi.mock` of the shim does not mock
 * the moved module, so a test silently runs against the real one
 * (research_stack_practices §5.3). The rule names the module to use instead.
 *
 * `eslint.config.mjs` turns it on with `{ root, shims }`: the repository
 * root, and the `MIGRATION_SHIMS` list that the move codemod writes into its
 * generated section (`migration-guard.ts`). It is a rule of its own, not a
 * `no-restricted-imports` pattern, for two reasons: ESLint keeps only the
 * last options set for a rule, which would drop the import-boundary bans,
 * and a relative specifier (`./dice` beside the shim) must be resolved
 * against the importer to be recognised. Being its own rule also lets bulk
 * suppressions count it apart.
 *
 * The module positions it reads are those of `module-specifiers.ts`; a
 * template literal is not read.
 *
 * Plain JavaScript, checked by TypeScript through `@ts-check`, because
 * `eslint.config.mjs` loads it with Node and no TypeScript loader.
 *
 * @module refactor/migration-guard-rule
 */
import { posix, relative, sep } from "node:path";

/**
 * A shim the move map keeps: the old path, a file or a folder, and where its
 * module now lives. Both are relative to the repository root.
 *
 * @typedef {{ readonly from: string; readonly to: string }} Shim
 */

/** @typedef {{ readonly root: string; readonly shims: readonly Shim[] }} GuardOptions */

// The `vi` methods that take a module path, as in module-specifiers.ts.
const VI_MODULE_METHODS = new Set([
  "mock",
  "doMock",
  "unmock",
  "doUnmock",
  "importActual",
  "importMock",
]);

// Node types whose `source` is a module specifier. typescript-eslint 8.72
// gives `typeof import("x")` and `import("x").T` a `source` too.
const SOURCE_HOLDERS = new Set([
  "ImportDeclaration",
  "ExportNamedDeclaration",
  "ExportAllDeclaration",
  "ImportExpression",
  "TSImportType",
]);

const CODE_EXTENSION = /(?:\.d)?\.[cm]?[jt]sx?$/;
const ALIAS = "@/";
const SRC = "src/";

/** @type {import("eslint").Rule.RuleModule} */
const noShimImport = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Ban importing or mocking a path the move map keeps as a temporary re-export shim.",
    },
    schema: [
      {
        type: "object",
        properties: {
          root: { type: "string" },
          shims: {
            type: "array",
            items: {
              type: "object",
              properties: { from: { type: "string" }, to: { type: "string" } },
              required: ["from", "to"],
              additionalProperties: false,
            },
          },
        },
        required: ["root", "shims"],
        additionalProperties: false,
      },
    ],
    messages: {
      shim: '"{{specifier}}" names {{shim}}, a temporary re-export shim. Use "{{replacement}}" instead (pnpm refactor:apply-moves rewrites it): a vi.mock of the shim does not mock the moved module.',
    },
  },
  create(context) {
    const options = readOptions(context.options[0]);
    const importer = repositoryPath(options.root, context.filename);
    if (
      importer === undefined ||
      options.shims.some((shim) => isAtOrUnder(importer, shim.from))
    )
      return {};
    return {
      Literal(node) {
        if (typeof node.value !== "string" || !namesModule(node)) return;
        const target = resolveSpecifier(node.value, importer);
        if (target === undefined) return;
        const shim = options.shims.find((candidate) =>
          namesShim(target, candidate.from)
        );
        if (shim === undefined) return;
        context.report({
          node,
          messageId: "shim",
          data: {
            specifier: node.value,
            shim: shim.from,
            replacement: replacementFor(node.value, target, shim),
          },
        });
      },
    };
  },
};

/** The ESLint plugin that holds the guard; `eslint.config.mjs` registers it as `migration-guard`. */
export const migrationGuard = {
  meta: { name: "migration-guard" },
  rules: { "no-shim-import": noShimImport },
};

/**
 * @param {unknown} value
 * @returns {GuardOptions}
 */
function readOptions(value) {
  const root = field(value, "root");
  const shims = field(value, "shims");
  if (typeof root !== "string" || !Array.isArray(shims))
    throw new Error("migration-guard/no-shim-import needs { root, shims }");
  return {
    root,
    shims: shims.flatMap((shim) => {
      const from = field(shim, "from");
      const to = field(shim, "to");
      return typeof from === "string" && typeof to === "string"
        ? [{ from, to }]
        : [];
    }),
  };
}

/**
 * True when the literal sits where a module specifier goes. The parent is
 * read as plain data: typescript-eslint's node types (`TSImportType`,
 * `TSExternalModuleReference`) are not in ESLint's ESTree types.
 *
 * @param {unknown} literal
 * @returns {boolean}
 */
function namesModule(literal) {
  const parent = field(literal, "parent");
  const type = field(parent, "type");
  if (typeof type === "string" && SOURCE_HOLDERS.has(type))
    return field(parent, "source") === literal;
  if (type === "TSExternalModuleReference") return true;
  // Earlier typescript-eslint 8 releases wrapped the `TSImportType` literal
  // in a TSLiteralType held as `argument`.
  if (type === "TSLiteralType")
    return field(field(parent, "parent"), "type") === "TSImportType";
  if (type !== "CallExpression") return false;
  const [first] = arrayField(parent, "arguments");
  return first === literal && isModuleCall(field(parent, "callee"));
}

/**
 * @param {unknown} callee
 * @returns {boolean}
 */
function isModuleCall(callee) {
  if (field(callee, "type") === "Identifier")
    return field(callee, "name") === "require";
  if (field(callee, "type") !== "MemberExpression") return false;
  const method = field(field(callee, "property"), "name");
  return (
    field(field(callee, "object"), "name") === "vi" &&
    typeof method === "string" &&
    VI_MODULE_METHODS.has(method)
  );
}

/**
 * The repository path a specifier points at, or `undefined` for a package.
 * The path may lack its extension, as the specifier does.
 *
 * @param {string} specifier
 * @param {string} importer
 * @returns {string | undefined}
 */
function resolveSpecifier(specifier, importer) {
  if (specifier.startsWith(ALIAS)) return SRC + specifier.slice(ALIAS.length);
  if (
    specifier === "." ||
    specifier === ".." ||
    specifier.startsWith("./") ||
    specifier.startsWith("../")
  )
    return posix.join(posix.dirname(importer), specifier);
  return undefined;
}

/**
 * True when a module path names the shim: it is the shim file, with or
 * without its extension or `/index`, or lies in the shim folder.
 *
 * @param {string} target
 * @param {string} shimPath
 * @returns {boolean}
 */
function namesShim(target, shimPath) {
  const stem = target.replace(CODE_EXTENSION, "");
  const shimStem = shimPath.replace(CODE_EXTENSION, "");
  return (
    isAtOrUnder(target, shimPath) ||
    stem === shimStem ||
    `${stem}/index` === shimStem
  );
}

/**
 * The specifier to write instead: the moved module, as `@/…` inside `src/`.
 *
 * @param {string} specifier
 * @param {string} target
 * @param {Shim} shim
 * @returns {string}
 */
function replacementFor(specifier, target, shim) {
  const moved = isAtOrUnder(target, shim.from)
    ? shim.to + target.slice(shim.from.length)
    : shim.to;
  const written = CODE_EXTENSION.test(specifier)
    ? moved
    : moved.replace(CODE_EXTENSION, "").replace(/\/index$/, "");
  return written.startsWith(SRC) ? ALIAS + written.slice(SRC.length) : written;
}

/**
 * The file's path relative to the repository root, POSIX, or `undefined`
 * when it lies outside.
 *
 * @param {string} root
 * @param {string} filename
 * @returns {string | undefined}
 */
function repositoryPath(root, filename) {
  const path = relative(root, filename).split(sep).join("/");
  return path === "" || path.startsWith("../") ? undefined : path;
}

/**
 * @param {string} path
 * @param {string} folder
 * @returns {boolean}
 */
function isAtOrUnder(path, folder) {
  return path === folder || path.startsWith(`${folder}/`);
}

/**
 * @param {unknown} value
 * @param {string} key
 * @returns {unknown}
 */
function field(value, key) {
  return typeof value === "object" && value !== null
    ? Reflect.get(value, key)
    : undefined;
}

/**
 * @param {unknown} value
 * @param {string} key
 * @returns {readonly unknown[]}
 */
function arrayField(value, key) {
  const items = field(value, key);
  return Array.isArray(items) ? items : [];
}
