-- Commander slugs transliterate accents, and the SQL slug matches commanderToSlug exactly.
--
-- commanderToSlug (src/lib/meta/fetch.ts) now applies Unicode NFD before its strip, so
-- "Lim-Dûl the Necromancer" slugs to "lim-dul-the-necromancer", the slug EDHREC serves,
-- instead of "lim-dl-the-necromancer", which EDHREC answers with a 403. The commander deck
-- route (src/app/api/community/commanders/[slug]/decks/route.ts) matches the same slug in
-- SQL with the expression below; this partial index covers it.
--
-- The expression gives the same slug under any database ctype:
-- - normalize(..., NFD) splits an accented letter into its base letter and a combining mark,
--   which the '[^a-z0-9 -]' strip then drops. It needs a UTF8 database.
-- - lower() runs under the "C" collation, so it lowercases ASCII only, which is all NFD
--   leaves to lowercase.
-- - The bracketed class lists the 25 characters JavaScript's \s and trim() treat as
--   whitespace. The previous expression used [[:space:]] and btrim's default instead, which
--   kept tabs and line breaks at the ends and stripped the no-break space.
--
-- Additive: Deck_commanderSlug_public_idx (migration 20260819210000) stays. The route no
-- longer uses its expression; a later migration can drop it.
--
-- If you change this expression, change the route's query, commanderToSlug and
-- src/lib/meta/commander-slug-parity.test.ts in the same commit.

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Deck_commanderSlug_v2_public_idx"
  ON "Deck" (
    regexp_replace(
      btrim(regexp_replace(
        regexp_replace(
          lower(normalize("commanderName", NFD) COLLATE "C"),
          '[\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]', ' ', 'g'
        ),
        '[^a-z0-9 -]', '', 'g'
      )),
      ' +', '-', 'g'
    )
  )
  WHERE "isPublic" = true;
