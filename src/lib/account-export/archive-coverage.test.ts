// @vitest-environment node
/**
 * The export guard: every relation from a Prisma model to `User` is either
 * exported in the account archive or excluded with a reason (I-38 testing
 * strategy, "a guard test fails when a new Prisma model with a userId is
 * neither exported nor listed as excluded").
 *
 * The relations are read from `prisma/schema.prisma` itself, so a model added
 * there is checked the day it lands, with no list to update first.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  EXCLUDED_UNLINKED_MODELS,
  EXCLUDED_USER_RELATIONS,
  EXPORTED_USER_RELATIONS,
} from "./archive-coverage";

const SCHEMA = readFileSync(
  join(process.cwd(), "prisma", "schema.prisma"),
  "utf8"
);

const MODEL_BLOCK = /^model\s+(\w+)\s*\{([^}]*)\}/gm;
/** A field line whose type is `User`, optional or not: `user User? @relation(…)`. */
const USER_FIELD = /^\s*(\w+)\s+User\??(?:\s|$)/gm;

/**
 * Every relation from a model to `User`, as `Model.field`, read from a Prisma
 * schema's source. Back-relation lists on `User` itself (`decks Deck[]`) are
 * not relations to `User` and are not read.
 */
function userRelations(schemaSource: string): string[] {
  return [...schemaSource.matchAll(MODEL_BLOCK)].flatMap(([, model, body]) =>
    [...body.matchAll(USER_FIELD)].map(([, field]) => `${model}.${field}`)
  );
}

/** @returns the relations to `User` that neither table covers, as `Model.field` */
function uncoveredUserRelations(
  schemaSource: string,
  exported: Readonly<Record<string, unknown>>,
  excluded: Readonly<Record<string, unknown>>
): string[] {
  return userRelations(schemaSource).filter(
    (relation) => !(relation in exported) && !(relation in excluded)
  );
}

describe("the account export guard", () => {
  it("reads the relations to User from a schema, so the checks below cannot pass vacuously", () => {
    expect(userRelations(SCHEMA)).toEqual(
      expect.arrayContaining([
        "Deck.user",
        "CardPackage.author",
        "UserFollow.follower",
        "UserFollow.following",
      ])
    );
  });

  it("a user-owned model that is neither exported nor excluded fails, naming the model", () => {
    const withNewModel = `${SCHEMA}
model Badge {
  id     String @id
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}
`;

    expect(
      uncoveredUserRelations(
        withNewModel,
        EXPORTED_USER_RELATIONS,
        EXCLUDED_USER_RELATIONS
      )
    ).toEqual(["Badge.user"]);
  });

  it("every relation to User in prisma/schema.prisma is exported or excluded", () => {
    expect(
      uncoveredUserRelations(
        SCHEMA,
        EXPORTED_USER_RELATIONS,
        EXCLUDED_USER_RELATIONS
      )
    ).toEqual([]);
  });

  it("no relation is both exported and excluded", () => {
    const both = Object.keys(EXPORTED_USER_RELATIONS).filter(
      (relation) => relation in EXCLUDED_USER_RELATIONS
    );

    expect(both).toEqual([]);
  });

  it("no entry names a relation the schema no longer has", () => {
    const relations = new Set(userRelations(SCHEMA));
    const stale = [
      ...Object.keys(EXPORTED_USER_RELATIONS),
      ...Object.keys(EXCLUDED_USER_RELATIONS),
    ].filter((relation) => !relations.has(relation));

    expect(stale).toEqual([]);
  });

  it("every model excluded without a relation exists and has no relation to User", () => {
    const models = new Set(
      [...SCHEMA.matchAll(MODEL_BLOCK)].map(([, model]) => model)
    );
    const linked = new Set(
      userRelations(SCHEMA).map((relation) => relation.split(".")[0])
    );

    const misplaced = Object.keys(EXCLUDED_UNLINKED_MODELS).filter(
      (model) => !models.has(model) || linked.has(model)
    );

    expect(misplaced).toEqual([]);
  });
});
