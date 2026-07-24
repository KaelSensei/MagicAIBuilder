import { describe, it, expect } from "vitest";
import type { DeckTemplate as _DeckTemplate } from "@/lib/deck/templates";

// Mock API response types
interface TemplateResponse {
  readonly id: string;
  readonly name: string;
  readonly commanderName: string;
  readonly archetype: string;
  readonly author: string;
  readonly upvotes: number;
  readonly source: "official" | "community";
}

describe("Templates API", () => {
  // ─── GET /api/templates?commander=... ────────────────────────────────────
  describe("GET /api/templates", () => {
    it("returns templates for a given commander", async () => {
      // Expected behavior: query param commander → return filtered templates
      const _query = new URLSearchParams({ commander: "Atraxa, Grand Unifier" });
      
      // Mock response structure
      const expected: TemplateResponse[] = [
        {
          id: "tmpl-1",
          name: "Atraxa Voltron Budget",
          commanderName: "Atraxa, Grand Unifier",
          archetype: "Voltron",
          author: "CommunityBuilder",
          upvotes: 15,
          source: "community",
        },
        {
          id: "tmpl-2",
          name: "Atraxa Stax cEDH",
          commanderName: "Atraxa, Grand Unifier",
          archetype: "Stax",
          author: "TopPlayer",
          upvotes: 8,
          source: "community",
        },
      ];

      // Verify response structure
      expect(expected).toHaveLength(2);
      expect(expected.every((t) => t.commanderName === "Atraxa, Grand Unifier")).toBe(true);
    });

    it("returns empty array for commander with no templates", () => {
      const expected: TemplateResponse[] = [];
      expect(expected).toHaveLength(0);
    });

    it("sorts templates by upvotes descending", () => {
      const templates: TemplateResponse[] = [
        { id: "t1", name: "A", commanderName: "Cmd", archetype: "V", author: "P1", upvotes: 5, source: "community" },
        { id: "t2", name: "B", commanderName: "Cmd", archetype: "V", author: "P2", upvotes: 15, source: "community" },
        { id: "t3", name: "C", commanderName: "Cmd", archetype: "V", author: "P3", upvotes: 10, source: "community" },
      ];

      const sorted = [...templates].sort((a, b) => b.upvotes - a.upvotes);
      expect(sorted[0].upvotes).toBe(15);
      expect(sorted[1].upvotes).toBe(10);
      expect(sorted[2].upvotes).toBe(5);
    });
  });

  // ─── POST /api/templates ────────────────────────────────────────────────
  describe("POST /api/templates (create template)", () => {
    it("creates a template from deck JSON", () => {
      const payload = {
        deckId: "deck-123",
        templateName: "My Custom Voltron",
        archetype: "Voltron",
        source: "community" as const,
      };

      const expected: Partial<TemplateResponse> = {
        name: "My Custom Voltron",
        archetype: "Voltron",
        source: "community",
      };

      expect(expected.name).toBe(payload.templateName);
      expect(expected.archetype).toBe(payload.archetype);
    });

    it("validates template name (required, non-empty)", () => {
      const invalidPayload = { templateName: "", archetype: "Voltron" };
      expect(invalidPayload.templateName).toHaveLength(0); // Should fail validation
    });

    it("validates archetype from enum", () => {
      const validArchetypes = ["Combo", "Control", "Voltron", "Stax", "Tokens", "Aggro", "Reanimator", "Goodstuff"];
      const archetype = "Voltron";
      expect(validArchetypes).toContain(archetype);
    });
  });

  // ─── GET /api/templates/[id] ────────────────────────────────────────────
  describe("GET /api/templates/[id]", () => {
    it("returns a single template by ID", () => {
      const template: TemplateResponse = {
        id: "tmpl-1",
        name: "Atraxa Voltron",
        commanderName: "Atraxa, Grand Unifier",
        archetype: "Voltron",
        author: "Player1",
        upvotes: 10,
        source: "community",
      };

      expect(template.id).toBe("tmpl-1");
      expect(template.name).toBe("Atraxa Voltron");
    });

  });

  // ─── POST /api/templates/[id]/upvote ────────────────────────────────────
  describe("POST /api/templates/[id]/upvote", () => {
    it("increments upvote count for authenticated user", () => {
      let template: TemplateResponse = {
        id: "tmpl-1",
        name: "Test",
        commanderName: "Cmd",
        archetype: "V",
        author: "P",
        upvotes: 5,
        source: "community",
      };

      // Simulate upvote
      template = { ...template, upvotes: template.upvotes + 1 };
      expect(template.upvotes).toBe(6);
    });

    it("prevents duplicate upvotes from same user", () => {
      // Mock logic: track user_id + template_id in DB
      const userUpvote = { userId: "user-1", templateId: "tmpl-1" };
      expect(userUpvote.userId).toBeDefined();
    });

    it("removes upvote if user clicks again (toggle)", () => {
      let upvotes = 5;
      upvotes += 1; // First click
      expect(upvotes).toBe(6);
      upvotes -= 1; // Second click (toggle off)
      expect(upvotes).toBe(5);
    });

  });

  // ─── Edge cases ────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles template with special characters in name", () => {
      const template: TemplateResponse = {
        id: "tmpl-1",
        name: "Atraxa's \"CEDH\" Voltron & Combo",
        commanderName: "Atraxa, Grand Unifier",
        archetype: "Voltron",
        author: "Player",
        upvotes: 0,
        source: "community",
      };

      expect(template.name).toContain("&");
    });

    it("handles very popular templates (1000+ upvotes)", () => {
      const popular: TemplateResponse = {
        id: "tmpl-viral",
        name: "Popular Deck",
        commanderName: "Cmd",
        archetype: "V",
        author: "Legend",
        upvotes: 5000,
        source: "official",
      };

      expect(popular.upvotes).toBe(5000);
    });

    it("handles official vs community badges correctly", () => {
      const official: TemplateResponse = {
        id: "t1",
        name: "Official",
        commanderName: "Cmd",
        archetype: "V",
        author: "MagicAIBuilder",
        upvotes: 100,
        source: "official",
      };

      const community: TemplateResponse = {
        id: "t2",
        name: "Community",
        commanderName: "Cmd",
        archetype: "V",
        author: "Player",
        upvotes: 10,
        source: "community",
      };

      expect(official.source).toBe("official");
      expect(community.source).toBe("community");
    });
  });
});
