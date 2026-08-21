/**
 * Templates API Routes
 * GET /api/templates — list templates for a commander
 * POST /api/templates — create a new template (admin/creator)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth/helpers";
import { readJsonBody } from "@/lib/api/json-body";

// ─── Validation Schemas ────────────────────────────────────────────────────
const TemplateQuerySchema = z.object({
  commander: z.string().min(1, "Commander name required"),
});

const CreateTemplateSchema = z.object({
  deckId: z.uuid("Invalid deck ID"),
  templateName: z.string().min(3, "Name must be 3+ chars").max(100, "Name max 100 chars"),
  archetype: z.enum([
    "Combo",
    "Control",
    "Stax",
    "Voltron",
    "Tokens",
    "Aggro",
    "Reanimator",
    "Goodstuff",
  ]),
  description: z.string().optional(),
});

// ─── GET /api/templates ────────────────────────────────────────────────────
/**
 * Retrieve templates for a given commander.
 * Query: ?commander=Atraxa, Grand Unifier
 * Returns: templates sorted by upvotes (descending)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const commander = searchParams.get("commander");

    // Validate input
    const validation = TemplateQuerySchema.safeParse({ commander });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid commander name" },
        { status: 400 }
      );
    }

    // MVP fallback: serve mock templates until the templates table is available.
    const mockTemplates = [
      {
        id: "tmpl-atraxa-voltron",
        name: "Atraxa Voltron Budget",
        commanderName: validation.data.commander,
        archetype: "Voltron",
        author: "CommunityBuilder",
        upvotes: 15,
        source: "community",
        createdAt: new Date(),
      },
      {
        id: "tmpl-atraxa-stax",
        name: "Atraxa Stax cEDH",
        commanderName: validation.data.commander,
        archetype: "Stax",
        author: "TopPlayer",
        upvotes: 8,
        source: "community",
        createdAt: new Date(),
      },
    ];

    return NextResponse.json(mockTemplates, { status: 200 });
  } catch (error) {
    logger.error("Unexpected error", "templates GET", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// ─── POST /api/templates ───────────────────────────────────────────────────
/**
 * Create a new template from an existing deck.
 * Body: { deckId, templateName, archetype, description? }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const jsonBody = await readJsonBody(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.value;
    const validation = CreateTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: z.flattenError(validation.error).fieldErrors },
        { status: 400 }
      );
    }

    const { templateName, archetype } = validation.data;

    // MVP fallback: echo a mock template response until persistence is wired in.
    const mockTemplate = {
      id: `tmpl-${Date.now()}`,
      name: templateName,
      commanderName: "Your Commander",
      archetype,
      author: "You",
      upvotes: 0,
      source: "community",
      createdAt: new Date(),
    };

    return NextResponse.json(mockTemplate, { status: 201 });
  } catch (error) {
    logger.error("Unexpected error", "templates POST", error);
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    );
  }
}
