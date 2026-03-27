# Quality Gate — MagicAIBuilder 🧪

> Maintained by Marco (`agent:marco`) — The Bug Whisperer.
> Updated automatically on each PR merge. Do not edit manually.

## Baseline (2026-03-27 — post PR #189)

| Metric | Baseline | Minimum | Status |
|---|---|---|---|
| **Coverage** | 94.3% | ≥ 90% | ✅ |
| **Bugs** | 0 | = 0 | ✅ |
| **Vulnerabilities** | 0 | = 0 | ✅ |
| **Code Smells** | 1 | ≤ 5 | ✅ |
| **Duplicated Lines** | 1.8% | ≤ 3.0% | ✅ |
| **Reliability Rating** | A (1.0) | A | ✅ |
| **Security Rating** | A (1.0) | A | ✅ |
| **Maintainability Rating** | A (1.0) | A | ✅ |
| **Security Hotspots** | 3 | ≤ 5 | ✅ |
| **Lines of Code** | 14 596 | — | ℹ️ |

## Thresholds — règles de blocage

Une PR est **bloquée** si elle fait régresser une des métriques suivantes :

| Metric | Seuil dur |
|---|---|
| Coverage | Ne doit pas descendre sous **90%** |
| Bugs | Doit rester à **0** |
| Vulnerabilities | Doit rester à **0** |
| Reliability Rating | Doit rester à **A** |
| Security Rating | Doit rester à **A** |
| Duplicated Lines | Ne doit pas dépasser **3.0%** |
| Code Smells | Ne doit pas dépasser **10** |

## Historique des métriques

| Date | PR | Coverage | Bugs | Vulns | Smells | Dups | Reliability | Security |
|---|---|---|---|---|---|---|---|---|
| 2026-03-27 | #183 (sonar fix + auth refacto) | 94.3% | 0 | 0 | 1 | 1.8% | A | A |
| 2026-03-27 | #189 (mobile responsive) | 94.3% | 0 | 0 | 1 | 1.8% | A | A |
| 2026-03-27 | #192 (US-01: Game Changers page) | 94.3% | 0 | 0 | 1 | 1.8% | A | A |

## Protocole de review (Marco ↔ Joyce)

### Quand une PR arrive

1. Marco lit le code et les diffs
2. Marco vérifie : CI (lint/typecheck/tests/build) + SonarCloud
3. Si métriques **stables ou améliorées** + pas de régression → **merge direct**
4. Si métriques **dégradées** ou problèmes détectés → Marco :
   - Liste les problèmes avec explication pédagogique (voir format ci-dessous)
   - Propose des fix
   - Si fix simples → Marco les applique, explique à Joyce, merge
   - Si fix structurels → Marco ouvre des comments sur la PR, attend Joyce

### Format de feedback à Joyce

```
🧪 Marco — Review #XXX

❌ Problème détecté : <métrique ou comportement>
📍 Fichier : <path>:<ligne>
🔍 Pourquoi c'est un problème : <explication claire>
✅ Fix recommandé : <suggestion concrète avec exemple de code si utile>
```

### Exemples de problèmes courants

**Coverage en baisse**
> Tu as ajouté `handleFoo()` dans `route.ts` mais `route.test.ts` ne teste pas les cas d'erreur.
> Ajoute au minimum : cas nominal + cas d'erreur Prisma.

**Code smell — cognitive complexity trop haute**
> La fonction `buildQuery()` atteint complexity 18 (SonarCloud bloque à 15).
> Extrait les blocs `if/switch` imbriqués en fonctions nommées.

**Duplication**
> Les blocs de validation Zod dans `route-a.ts` et `route-b.ts` sont quasi-identiques.
> Extrait un schema partagé dans `lib/validation/`.

**Bug potentiel**
> `requireDeckOwner` ne catch pas les erreurs Prisma — une erreur DB fait crasher le handler parent.
> Wrap dans un try/catch ou gère l'erreur dans la fonction.

## Open backlog QA (gaps auth — identifiés 2026-03-27)

Ces gaps ne bloquent pas les merges en cours mais doivent être adressés :

| Priorité | Cible | Description |
|---|---|---|
| 🚨 P0 | `src/lib/auth/edge-config.ts` | `authorized` callback — zéro test (paths publics, 401 API, redirect) |
| 🚨 P0 | `src/lib/auth/config.ts` | `Credentials.authorize` — non testée (user sans mdp, mdp incorrect, user inexistant) |
| ⚠️ P1 | `src/app/api/collection/route.ts` | Zéro test auth + isolation user |
| ⚠️ P1 | `src/app/api/decks/route.ts` | Isolation user non testée sur GET |
| ℹ️ P2 | `src/lib/auth/helpers.ts` | `requireDeckOwner` — erreurs Prisma non catchées |
| ℹ️ P2 | `src/app/api/user/profile/route.ts` | PATCH body vide + 500 Prisma non testés |

---

*Ce fichier est la source de vérité qualité du projet. Toute dégradation par rapport à la baseline déclenche une action corrective.*
