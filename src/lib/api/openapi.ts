/**
 * The OpenAPI 3.1 description of `/api/v1`.
 *
 * Hand-authored rather than generated. Nothing in this stack can derive a spec
 * from an App Router handler — the request shape lives in a zod schema inside
 * the function body, and the response shape only in the object it returns — so
 * a "generator" here would be a second hand-written source pretending to be
 * derived. One honest hand-written source, guarded by a test that walks the
 * route files, is the smaller lie.
 *
 * **The guard is the point.** A spec that drifts is worse than no spec: callers
 * build against a contract the server never had, and the failure surfaces in
 * their code rather than ours. `openapi.test.ts` asserts every documented path
 * has a route file and every `/api/v1` route file is documented, so adding an
 * endpoint without describing it fails the suite.
 */

import { API_SCOPES } from "./keys";

/** Bumped when the response shape of an existing endpoint changes incompatibly. */
export const API_VERSION = "1.0.0";

/**
 * Paths this document describes, as they appear under `/api/v1`.
 *
 * Kept as a named export so the drift test can compare it against the
 * filesystem without re-parsing the whole document.
 */
export const DOCUMENTED_PATHS = ["/decks", "/decks/{id}", "/collection"] as const;

const ERROR_RESPONSE = {
  description: "Error",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
    },
  },
} as const;

/**
 * @param serverUrl - absolute base for the `servers` block, e.g. `https://…/api/v1`
 */
export function buildOpenApiDocument(serverUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "MagicAIBuilder API",
      version: API_VERSION,
      description:
        "Read access to your own MagicAIBuilder decks. Authenticate with an API key created from your account settings and sent as `Authorization: Bearer mab_…`. Keys are scoped; a key missing the scope an endpoint needs is answered 403, not 401.",
    },
    servers: [{ url: serverUrl }],
    security: [{ apiKey: [] }],
    components: {
      securitySchemes: {
        apiKey: {
          type: "http",
          scheme: "bearer",
          description: `Scopes: ${API_SCOPES.join(", ")}. Rate limit: 120 requests per minute per key.`,
        },
      },
      schemas: {
        Error: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code: {
                  type: "string",
                  enum: [
                    "unauthorized",
                    "forbidden",
                    "not_found",
                    "rate_limited",
                    "invalid_request",
                    "server_error",
                  ],
                },
                message: { type: "string" },
              },
            },
          },
        },
        Pagination: {
          type: "object",
          required: ["page", "limit", "total"],
          properties: {
            page: { type: "integer", minimum: 0 },
            limit: { type: "integer", minimum: 1, maximum: 100 },
            total: {
              type: "integer",
              minimum: 0,
              description: "Total decks, not total pages.",
            },
          },
        },
        DeckSummary: {
          type: "object",
          required: ["id", "name", "format", "cardCount", "createdAt", "updatedAt"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            format: { type: "string" },
            commanderName: { type: ["string", "null"] },
            targetBracket: { type: "integer", minimum: 1, maximum: 5 },
            isPublic: { type: "boolean" },
            cardCount: { type: "integer", minimum: 0 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        DeckCard: {
          type: "object",
          required: ["scryfallId", "name", "quantity"],
          properties: {
            scryfallId: { type: "string" },
            name: {
              type: "string",
              description:
                "Always the English name. Card names are stored, searched and exported in English; a translated name would denormalise a translation into every deck holding the card.",
            },
            manaCost: { type: "string" },
            cmc: { type: "number" },
            typeLine: { type: "string" },
            colorIdentity: { type: "array", items: { type: "string" } },
            category: { type: "string" },
            quantity: { type: "integer", minimum: 1 },
            isCommander: { type: "boolean" },
            isPartner: { type: "boolean" },
            zone: { type: "string", enum: ["main", "sideboard", "maybeboard"] },
            price: { type: ["number", "null"] },
          },
        },
        CollectionCard: {
          type: "object",
          required: ["scryfallId", "name", "quantity", "foil"],
          properties: {
            scryfallId: { type: "string" },
            name: { type: "string" },
            quantity: { type: "integer", minimum: 1 },
            foil: {
              type: "boolean",
              description:
                "The same card in both finishes is two entries, not one with a flag — that is how the collection stores it.",
            },
            condition: {
              type: ["string", "null"],
              enum: ["NM", "LP", "MP", "HP", "DMG", null],
            },
            acquiredAt: { type: ["string", "null"], format: "date-time" },
            price: { type: ["number", "null"] },
          },
        },
        Deck: {
          allOf: [
            { $ref: "#/components/schemas/DeckSummary" },
            {
              type: "object",
              required: ["cards"],
              properties: {
                description: { type: ["string", "null"] },
                tags: { type: "array", items: { type: "string" } },
                budget: { type: ["number", "null"] },
                cards: {
                  type: "array",
                  items: { $ref: "#/components/schemas/DeckCard" },
                },
              },
            },
          ],
        },
      },
    },
    paths: {
      "/decks": {
        get: {
          summary: "List your decks",
          description:
            "Decks belonging to the key's owner, most recently updated first. Never other users' decks, public or otherwise.",
          operationId: "listDecks",
          // OpenAPI's `security` scope array is only meaningful for oauth2 and
          // openIdConnect; on an http-bearer scheme it is ignored, so the
          // requirement would be documented nowhere. An extension states it
          // where a reader and the drift test can both find it.
          "x-required-scope": "decks:read",
          parameters: [
            {
              name: "page",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 0, default: 0 },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 100, default: 25 },
              description:
                "A value above 100 is rejected with 400 rather than clamped, so a full page is never mistaken for the last one.",
            },
          ],
          responses: {
            "200": {
              description: "A page of decks",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["data", "pagination"],
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/DeckSummary" },
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                },
              },
            },
            "400": ERROR_RESPONSE,
            "401": ERROR_RESPONSE,
            "403": ERROR_RESPONSE,
            "429": ERROR_RESPONSE,
            "500": ERROR_RESPONSE,
          },
        },
      },
      "/decks/{id}": {
        get: {
          summary: "Read one deck, with its cards",
          operationId: "getDeck",
          "x-required-scope": "decks:read",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
          ],
          responses: {
            "200": {
              description: "The deck",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["data"],
                    properties: { data: { $ref: "#/components/schemas/Deck" } },
                  },
                },
              },
            },
            "401": ERROR_RESPONSE,
            "403": ERROR_RESPONSE,
            "404": {
              ...ERROR_RESPONSE,
              description:
                "No such deck, or it belongs to someone else — the two are deliberately indistinguishable.",
            },
            "429": ERROR_RESPONSE,
            "500": ERROR_RESPONSE,
          },
        },
      },
      "/collection": {
        get: {
          summary: "List your physical card collection",
          description:
            "Cards the key's owner has marked as owned, by name then finish. A card held in both normal and foil is two entries, which is how the collection stores it.",
          operationId: "listCollection",
          "x-required-scope": "collection:read",
          parameters: [
            {
              name: "page",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 0, default: 0 },
            },
            {
              name: "limit",
              in: "query",
              required: false,
              schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
            },
          ],
          responses: {
            "200": {
              description: "A page of owned cards",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["data", "pagination"],
                    properties: {
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/CollectionCard" },
                      },
                      pagination: { $ref: "#/components/schemas/Pagination" },
                    },
                  },
                },
              },
            },
            "400": ERROR_RESPONSE,
            "401": ERROR_RESPONSE,
            "403": ERROR_RESPONSE,
            "429": ERROR_RESPONSE,
            "500": ERROR_RESPONSE,
          },
        },
      },
    },
  };
}
