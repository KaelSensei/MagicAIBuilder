# OpenClaw Init Prompt - MagicAIBuilder

Copy-paste this prompt into OpenClaw pour bootstrapper le projet.

---

## Prompt

```
Tu es un dev senior frontend React/Next.js. Tu vas initialiser le projet MagicAIBuilder, un deck builder Commander (EDH) pour Magic: The Gathering.

## Context

Lis d'abord ces fichiers dans le repo pour comprendre le projet :
- README.md : vision generale, deux modes, positionnement
- docs/PROJECT_SPEC.md : spec technique Phase 1 complete (stack, structure, types, endpoints, UI layout, user stories)
- docs/references/game-changers.md : la Game Changers list pour le systeme de brackets
- docs/references/banlists.md : la banlist Commander
- docs/references/edh-themes.md : les themes/archetypes (pour plus tard, Phase 3)

## Ce que tu dois faire

### 1. Init le projet Next.js

```bash
pnpx create-next-app@latest magic-ai-builder --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd magic-ai-builder
```

### 2. Installer les deps

```bash
pnpm add zustand @tanstack/react-query framer-motion @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities lucide-react
pnpm add -D prettier eslint-config-prettier
```

### 3. Installer shadcn/ui

```bash
pnpx shadcn@latest init
```

Puis ajouter les composants de base :
```bash
pnpx shadcn@latest add button input dialog card badge tooltip scroll-area separator sheet command popover
```

### 4. Creer la structure de dossiers

Suis exactement la structure definie dans docs/PROJECT_SPEC.md section "Project Structure".

### 5. Configurer le theme dark

Tailwind config avec les design tokens de la spec (section "Theme & Design Tokens") :
- Background near-black (#0a0a0f)
- Surface panels (#12121a)
- Accent indigo (#6366f1)
- Mana colors (W/U/B/R/G)
- Bracket colors (green/blue/amber/red)

Le dark mode doit etre le DEFAULT, pas un toggle.

### 6. Scaffolder les composants de base

Cree des versions minimales (placeholder) de chaque composant liste dans la spec. Chaque composant doit :
- Avoir les bons props TypeScript
- Rendre un placeholder visible (pas un div vide)
- Etre exporte proprement

### 7. Creer le Scryfall API client

Implemente `src/lib/scryfall/client.ts` avec :
- Rate limiting (100ms entre les requetes, queue)
- Headers requis par Scryfall (User-Agent, Accept)
- Types TypeScript pour les reponses Scryfall
- Fonctions : searchCards, getCardByName, getCardByFuzzyName, batchLookup, getAutocomplete, getGameChangers, getBannedCards

### 8. Creer le Zustand store

Implemente `src/lib/deck/store.ts` avec les types de la spec et les actions :
- setCommander, setPartner
- addCard, removeCard, moveCard (entre categories)
- setTargetBracket, setBudget
- importDeck, exportDeck
- computed: getStats, getBracketScore

### 9. Creer la page builder

Assemble les composants dans `src/app/builder/[deckId]/page.tsx` en suivant le layout ASCII de la spec :
- Panel gauche : recherche + resultats (300px)
- Centre : editeur de deck (categories avec cartes)
- Panel droit : stats + bracket score + checks

### 10. Premier rendu fonctionnel

Objectif : pouvoir chercher une carte sur Scryfall, voir l'image, et l'ajouter au deck. Le bracket score et les stats doivent se mettre a jour en temps reel.

## Regles importantes

- TypeScript strict, pas de `any`
- Composants fonctionnels uniquement, hooks pour la logique
- Framer Motion pour TOUTES les animations (hover, drag, transitions)
- Dark theme UNIQUEMENT (pas de light mode)
- L'esthetique est la priorite #1. Chaque composant doit etre beau, soigne, avec des micro-interactions
- Les images de cartes viennent de Scryfall (cards.scryfall.io)
- Rate limit Scryfall : 10 req/s max, implemente un debounce sur la recherche (300ms)
- Ne fetch PAS tout au demarrage. Lazy load, recherche a la demande
- Pas de localStorage pour les decks en Phase 1 (on gere en memoire)
```

---

## Notes

- Ce prompt est concu pour etre donne tel quel a OpenClaw
- Il reference les fichiers du repo, donc OpenClaw doit avoir acces au dossier MagicAIBuilder
- Si OpenClaw demande des precisions, renvoie-le vers `docs/PROJECT_SPEC.md`
- Phase 1 = Free Build uniquement. L'IA (Phase 3) viendra plus tard
- Pense a commit regulierement au fur et a mesure que les composants sont fonctionnels
