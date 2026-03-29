/**
 * Deck Templates — Reusable pre-built deck archetypes
 * Pure functions for template creation, application, and retrieval
 */

import type { Deck, DeckCard } from "@/lib/deck/types";
import { randomAlphanumericId } from "@/lib/crypto-random";

/**
 * A template is a pre-built deck configuration that players can use as a starting point.
 */
export interface DeckTemplate {
  readonly id: string;
  readonly name: string;
  readonly commanderName: string;
  readonly archetype: string; // e.g., "Voltron", "Combo", "Control", "Stax"
  readonly deckList: readonly DeckCard[]; // 99 main deck cards (commander separate or first)
  readonly author: string;
  readonly upvotes: number;
  readonly source: "official" | "community"; // Official curated vs. community-submitted
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Create a template from an existing deck.
 * The deck's 99 main deck cards become the template (commander stored separately).
 */
export function createTemplate(
  deck: Deck,
  templateName: string,
  archetype: string,
  source: "official" | "community",
  authorOverride?: string
): DeckTemplate {
  // Main deck cards only (99 total, commander separate)
  const mainDeckCards = deck.cards.slice(0, 99);

  return {
    id: `tmpl-${Date.now()}-${randomAlphanumericId(9)}`,
    name: templateName,
    commanderName: deck.commander?.name || "Unknown Commander",
    archetype,
    deckList: mainDeckCards,
    author: authorOverride || "MagicAIBuilder",
    upvotes: 0,
    source,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Apply a template to create a new deck.
 * This doesn't modify the template; it creates a fresh deck from it.
 * Note: userId is handled at the API layer when saving the deck to DB.
 */
export function applyTemplate(
  template: DeckTemplate,
  deckName: string
): Deck {
  // Extract commander name and find it in the deck list (if available)
  const commanderCard = template.deckList.find(
    (c) => c.name === template.commanderName
  );

  return {
    id: `deck-${Date.now()}-${randomAlphanumericId(9)}`,
    name: deckName,
    description: `Based on template: ${template.name} by ${template.author}`,
    commander: commanderCard ?? null,
    partner: null,
    companion: null,
    pairingType: "none",
    cards: [...template.deckList],
    maybeboard: [],
    format: "commander",
    targetBracket: 3,
    manualBracket: null,
    budget: null,
    tags: [],
    shareToken: null,
    shareEnabled: false,
    isPublic: false,
    isAIGenerated: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Get all templates for a given commander, sorted by upvotes (descending).
 */
export function getTemplatesForCommander(
  templates: readonly DeckTemplate[],
  commanderName: string
): DeckTemplate[] {
  return templates
    .filter((t) => t.commanderName === commanderName)
    .sort((a, b) => b.upvotes - a.upvotes);
}

/**
 * Get top N templates for a commander (for preview/recommendation).
 */
export function getTopTemplatesForCommander(
  templates: readonly DeckTemplate[],
  commanderName: string,
  limit = 3
): DeckTemplate[] {
  return getTemplatesForCommander(templates, commanderName).slice(0, limit);
}

/**
 * Search templates by name (case-insensitive substring match).
 */
export function searchTemplates(
  templates: readonly DeckTemplate[],
  query: string
): DeckTemplate[] {
  const lowerQuery = query.toLowerCase();
  return templates.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.commanderName.toLowerCase().includes(lowerQuery) ||
      t.archetype.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Filter templates by archetype.
 */
export function filterByArchetype(
  templates: readonly DeckTemplate[],
  archetype: string
): DeckTemplate[] {
  return templates.filter((t) => t.archetype === archetype);
}

/**
 * Filter by source (official vs. community).
 */
export function filterBySource(
  templates: readonly DeckTemplate[],
  source: "official" | "community"
): DeckTemplate[] {
  return templates.filter((t) => t.source === source);
}

/**
 * Get popular templates (high upvotes).
 */
export function getPopularTemplates(
  templates: readonly DeckTemplate[],
  minUpvotes = 5
): DeckTemplate[] {
  return templates
    .filter((t) => t.upvotes >= minUpvotes)
    .sort((a, b) => b.upvotes - a.upvotes);
}
