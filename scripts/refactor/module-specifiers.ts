/**
 * Finds every string literal in a source file that names a module, with
 * ts-morph's syntax tree, so that the move codemod can rewrite exactly those.
 *
 * A literal names a module in these positions:
 * - `import … from "x"`, `import "x"`, `export … from "x"`, `import y = require("x")`;
 * - `import("x")`, including inside `vi.mock(import("x"))`;
 * - the type forms `typeof import("x")` and `import("x").T`;
 * - `require("x")`;
 * - the first argument of `vi.mock`, `vi.doMock`, `vi.unmock`, `vi.doUnmock`,
 *   `vi.importActual` and `vi.importMock`.
 *
 * Only syntax is read: no type checking and no module resolution, which
 * `specifier-resolution.ts` does. A literal inside a comment or a template
 * with `${}` is not a specifier and is never returned.
 *
 * @module refactor/module-specifiers
 */
import {
  Node,
  Project,
  SyntaxKind,
  type CallExpression,
  type NoSubstitutionTemplateLiteral,
  type StringLiteral,
} from "ts-morph";

/** A module specifier as written in a source file. */
export interface SpecifierLiteral {
  /** The specifier without its quotes, e.g. `@/lib/db/prisma`. */
  readonly value: string;
  /** Offset of the opening quote. */
  readonly start: number;
  /** Offset just after the closing quote. */
  readonly end: number;
  /** 1-based line of the literal. */
  readonly line: number;
}

// The `vi` methods that take a module path or an `import()` promise, from the
// `VitestUtils` interface of vitest 3.2.7 (node_modules/vitest/dist/index.d.ts).
const VI_MODULE_METHODS: ReadonlySet<string> = new Set([
  "mock",
  "doMock",
  "unmock",
  "doUnmock",
  "importActual",
  "importMock",
]);

// One in-memory project parses every file in turn; nothing is read from or
// written to disk through it, and each file is removed once scanned so that
// memory stays flat over the repository's thousand-odd sources.
const parser = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: { allowJs: true },
});

/**
 * Lists the module specifiers of one source file in source order.
 *
 * @param path - decides how the text is parsed (`.tsx` and `.jsx` enable JSX); nothing is read from it
 */
export function findModuleSpecifiers(
  path: string,
  text: string
): readonly SpecifierLiteral[] {
  const sourceFile = parser.createSourceFile(path, text, { overwrite: true });
  try {
    return [
      ...sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral),
      ...sourceFile.getDescendantsOfKind(
        SyntaxKind.NoSubstitutionTemplateLiteral
      ),
    ]
      .filter(namesModule)
      .map((literal) => ({
        value: literal.getLiteralValue(),
        start: literal.getStart(),
        end: literal.getEnd(),
        line: literal.getStartLineNumber(),
      }))
      .sort((a, b) => a.start - b.start);
  } finally {
    parser.removeSourceFile(sourceFile);
  }
}

function namesModule(
  literal: StringLiteral | NoSubstitutionTemplateLiteral
): boolean {
  const parent = literal.getParent();
  if (Node.isImportDeclaration(parent) || Node.isExportDeclaration(parent)) {
    return parent.getModuleSpecifier() === literal;
  }
  if (Node.isExternalModuleReference(parent)) return true;
  if (Node.isLiteralTypeNode(parent))
    return Node.isImportTypeNode(parent.getParent());
  if (Node.isCallExpression(parent)) {
    return parent.getArguments()[0] === literal && isModuleCall(parent);
  }
  return false;
}

function isModuleCall(call: CallExpression): boolean {
  const callee = call.getExpression();
  if (callee.getKind() === SyntaxKind.ImportKeyword) return true;
  if (Node.isIdentifier(callee)) return callee.getText() === "require";
  if (Node.isPropertyAccessExpression(callee)) {
    return (
      callee.getExpression().getText() === "vi" &&
      VI_MODULE_METHODS.has(callee.getName())
    );
  }
  return false;
}
