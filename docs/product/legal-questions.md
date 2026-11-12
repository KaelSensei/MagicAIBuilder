# Legal Questions For Counsel

> **This is research, not legal advice.** Every legal reading in the roadmap and the specs is a hypothesis written by non-lawyers for a French/EU lawyer to confirm or correct. This brief collects those hypotheses as questions. Nothing here should be acted on as an answer.
>
> **Compiled 2026-11-10** from [`roadmap.md`](roadmap.md) (the dated status notes under [Backlog snapshot](roadmap.md#backlog-snapshot---2026-10-20)), the open questions of every spec in [`specs/`](specs/README.md), [I-30 requirement 7.2](specs/i30-business-model-and-paid-tier.md#7-the-legal-gate) and [I-38](specs/i38-trust-safety-and-user-rights.md#open-questions), and [`competitive-landscape.md`](competitive-landscape.md). About 158 individual lawyer questions in 36 specs reduce to the first 39 below. The ninth pass of the same day added L-40 to L-48 in [section L](#l-the-ai-act-selling-terms-and-operations-added-2026-11-10), the tenth added L-49 and L-50 in [section M](#m-preview-cards-and-set-pages-added-2026-11-10), and the eleventh added L-51 and L-52 in [section N](#n-bracket-benchmarks-and-deck-retention-added-2026-11-11), for 52 in all; the tenth also added to L-14, L-16, L-37, L-39 and L-43, and the eleventh to L-21, L-22 and L-24, and the thirteenth (2026-11-12) added (c) to L-18 and (g) to L-21. Owner product decisions are out of scope and belong in a separate document. Each answer should be written down and committed under `docs/`, as [I-30 requirement 7.1](specs/i30-business-model-and-paid-tier.md#7-the-legal-gate) requires before any billing.

## One-page summary

### The ten answers that unblock the most work

Ranked by how many initiatives and slices wait on the answer, weighted toward the three critical paths: billing, the privacy policy and account email.

| #   | Question                                                                                                                                                    | What waits on it                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | [L-16](#l-16-does-a-paid-tier-fit-wizards-fan-content-policy): does a paid tier fit Wizards' Fan Content Policy?                                            | All billing (I-30 slices 6–11) and the paid line of 17 other initiatives                                                              |
| 2   | [L-08](#l-08-minors-the-stated-minimum-age-and-adult-only-features): minimum age, under-15 consent, adult-only features                                     | I-35, I-38, I-41, I-44, I-53, I-56, I-59, I-60, I-63                                                                                  |
| 3   | [L-20](#l-20-is-a-paid-tool-over-scryfall-data-paywalling-it): is a paid tool over Scryfall data "paywalling" it?                                           | I-30, I-32, I-40, I-45, I-47, I-56, I-59 price and watch features                                                                     |
| 4   | [L-05](#l-05-processors-transfers-and-what-the-privacy-policy-must-name): processors, transfers and the privacy policy                                      | I-38's privacy policy, I-30, I-39, I-52, I-61, I-63, I-66                                                                             |
| 5   | [L-10](#l-10-retention-periods): retention periods                                                                                                          | I-38's retention job, I-30, I-41, I-43, I-52, I-63, I-64                                                                              |
| 6   | [L-13](#l-13-audience-measurement-error-replay-and-device-reads): audience measurement, Sentry replay, device reads                                         | Cookie banner or not; I-05, I-34, I-36, I-38, I-39, I-52                                                                              |
| 7   | [L-14](#l-14-are-notices-the-player-turned-on-prospection): are notices the player turned on prospection?                                                   | Every opt-in email: I-44, I-48, I-51, I-52, I-59, I-60, I-63                                                                          |
| 8   | [L-15](#l-15-the-legal-basis-for-security-email): the legal basis for security email                                                                        | Password reset, verification and security notices (I-61, I-63, I-38, I-30)                                                            |
| 9   | [L-17](#l-17-affiliate-links-sponsorships-and-donations-under-the-fan-content-policy): affiliate links, sponsors and donations under the Fan Content Policy | The fallback revenue and I-32, I-33, I-45, I-53, I-56                                                                                 |
| 10  | [L-03](#l-03-withdrawal-renewal-and-cancellation-for-the-subscription): withdrawal, renewal and cancellation                                                | I-30 slices 7–9 and so every paid entitlement; pairs with the accountant's [L-01](#l-01-legal-structure-vat-and-invoicing-accountant) |

Added 2026-11-10, outside the ranking: [L-40](#l-40-the-ai-acts-transparency-duties-art-50), the AI Act's marking duty, carries the nearest date of any question, 2026-12-02, if the grace period applies. Ask it first.

### Facts about the product the lawyer needs

- **What it is.** A Commander deckbuilder for Magic: The Gathering, in English and French, at an unregistered address: `magicaibuilder.com` is hard-coded but nobody has registered it ([roadmap, seventh pass](roadmap.md#backlog-snapshot---2026-10-20)).
- **Who runs it.** One owner, an individual in France, who is also the only moderator. No company or tax structure has been chosen yet ([I-30 7.2](specs/i30-business-model-and-paid-tier.md#7-the-legal-gate)).
- **Who uses it.** Commander players, teenagers among them ([I-38 9](specs/i38-trust-safety-and-user-rights.md#9-minors)). No analytics exist, so no audience figure exists.
- **Hosting.** Vercel for the application; no function region is set, so functions default to Washington, D.C. (`iad1`), and the plan in use is not recorded. The PostgreSQL database is documented as Supabase in `eu-west-1` (Ireland), on the free plan the code assumes ([infrastructure](../engineering/infrastructure.md), [I-66 open questions](specs/i66-running-costs-and-margin.md#open-questions)).
- **Sign-in.** Google through Auth.js, or email and password. Signup asks for name, email and password, records no terms acceptance and no age. No email sender exists, so there is no password reset or email verification today.
- **Data held.** Accounts and profiles; public and private decks, primers and card notes; collections; comments, star ratings, reviews and votes; follows; share links; playtest sessions; deck reports; API keys; notification preferences. Error logs carry the user id ([I-38 current state](specs/i38-trust-safety-and-user-rights.md#current-state-in-this-codebase)).
- **Third parties receiving data.** Prompts go to Anthropic (`claude-haiku-4-5`) and fall back to OpenAI (`gpt-4o-mini`); only signed-in users can call them. Sentry records Session Replay for 1% of sessions and every session with an error. Vercel Speed Insights loads on every page. None of this is disclosed: there is no privacy policy, legal notice, terms or cookie banner.
- **Free today.** No billing, ads, affiliate links or product analytics. Public decks are readable without an account, and a key-based public API serves decks and collections.
- **The planned paid tier** ([I-30 3](specs/i30-business-model-and-paid-tier.md#3-plans-prices-and-unit-economics)). "Content free, tools paid": card data, deck pages, guides and evidence stay free; AI use above a monthly allowance, personal tools and early access are paid. Prices VAT included: €3.99 a month or €29.99 a year first (H1), €4.99 or €39.99 later (H2). Sold through a merchant of record such as Paddle, or Stripe with Stripe Tax. If counsel says no, the fallback is donations, labelled sponsorships and affiliate links ([I-30 7.3](specs/i30-business-model-and-paid-tier.md#7-the-legal-gate)).

## A. Company form and selling a subscription from France

### L-01: Legal structure, VAT and invoicing (accountant)

Should the owner sell as a micro-entrepreneur or through a company, given a planned €3.99/€29.99 subscription sold EU-wide? Does the VAT franchise apply, and what do social contributions cost at each level? If a merchant of record resells the plan, the owner's only customer is that merchant: what are his e-invoicing duties? If he uses Stripe instead, he files VAT OSS returns himself. Can his structure recover the VAT on hosting and AI providers, whose prices exclude it?

- **Why it matters:** the net per plan (€2.63 a month or about €23 a year through a merchant of record) and the break-even both depend on it.
- **Unblocks:** I-30 slice 0, then slices 7–11; I-66 requirement 5 and open question 7; I-33 slice 5's revenue comparison.
- **Raised in / sources:** [I-30 7.2](specs/i30-business-model-and-paid-tier.md#7-the-legal-gate), [I-66 open questions](specs/i66-running-costs-and-margin.md#open-questions). European Commission, [OSS: declare and pay](https://vat-one-stop-shop.ec.europa.eu/one-stop-shop/declare-and-pay-oss_en); Your Europe, [Cross-border VAT](https://europa.eu/youreurope/business/taxation/vat/cross-border-vat/index_en.htm) (checked 2026-07-13); impots.gouv.fr, [Je passe à la facturation électronique](https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique) (modified 2026-09-01).

### L-02: Platform contracts that change once money flows

Vercel's Hobby plan is "restricted to non-commercial personal use only", and a payment request or an advertisement counts as commercial. Do affiliate links (I-32) or a donations page count too? Discord's Developer Policy governs "paid features or capabilities for their Application": does a paid web plan whose output reaches a Discord server by webhook, such as a store's night line-up or a creator's feed, fall under it? Both vendors should also be asked in writing.

- **Why it matters:** moving to Vercel Pro and Supabase Pro costs about €40–44 a month before VAT; selling inside Discord would bring its own billing rules.
- **Unblocks:** I-66 open question 4; I-32 slice 6; I-30 slice 12; I-41's store plan and I-36's creator feeds as paid candidates that post through I-46's webhooks.
- **Deadline:** before the first payment request, ad or affiliate link goes live.
- **Raised in / sources:** [I-66](specs/i66-running-costs-and-margin.md#open-questions), [I-46](specs/i46-discord-and-chat-integrations.md#open-questions). Vercel, [Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines) (updated 2026-09-14, read 2026-11-10); Discord, [Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy) (effective 2024-07-08).

## B. Consumer law

### L-03: Withdrawal, renewal and cancellation for the subscription

(a) Is the plan "digital content" (L221-28 13°) or a service? (b) The spec prefers a no-questions 14-day refund on a first purchase over an unticked waiver box confirmed on a durable medium: is that compliant either way? (c) With a merchant of record, who owes the withdrawal function (L221-21), the online termination function (L215-1-1, D215-2) and the renewal reminder? (d) Does L215-1's reminder, three months to one month before renewal, apply to monthly plans as well as yearly ones? (e) Does a store plan sold to businesses (I-41) escape these flows?

- **Why it matters:** checkout, cancellation and the renewal email are designed around these answers, and no email sender exists yet.
- **Unblocks:** I-30 slices 7, 8 and 9, and so every paid entitlement; I-41's store plan.
- **Deadline:** the withdrawal function of L221-21 has applied since 2026-06-19, so it binds the first checkout.
- **Price rises (2026-11-10):** how a price rise reaches existing monthly and yearly subscribers, and whether it may take effect at the next renewal without new consent, is asked once, in [L-42](#l-42-conformity-guarantee-price-rises-and-feature-removals) (b).
- **Raised in / sources:** [I-30 6.5–6.7 and 7.2](specs/i30-business-model-and-paid-tier.md#6-billing-accounts-and-the-subscription-lifecycle), [I-41](specs/i41-store-commander-nights.md#open-questions). Légifrance: [L221-18](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226842), [L221-21](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000032226834) (in force 2026-06-19), [L221-28](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563170), [L215-1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000034072591/), [D215-2](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000047615001); INC, [La résiliation des abonnements en trois clics](https://www.inc-conso.fr/content/la-resiliation-des-abonnements-et-contrats-renouvelables-en-trois-clics) (2024-02-26); Your Europe, [Guarantees and returns](https://europa.eu/youreurope/citizens/consumers/shopping/returns/index_en.htm).

### L-04: The loi Toubon and French help for paid features

The help centre (I-64) is drafted in English first, and French pages may list English articles until a French reviewer approves them. Are help articles for a paid service sold in France its "mode d'emploi" under article 2 of the loi Toubon, so that French versions become mandatory for paid features? Raised by this brief, not a spec: does the same reasoning reach official rules and rulings shown in English inside the French interface ([I-47 open question 2](specs/i47-rules-answers-for-this-deck.md#open-questions))?

- **Why it matters:** it decides whether French review gates the launch of each paid feature.
- **Unblocks:** I-64 slices 6 and 13; the French review cadence of I-34 slice 7 and I-47.
- **Raised in / sources:** [I-64](specs/i64-help-centre-and-guidance.md#open-questions). [Loi n° 94-665 du 4 août 1994](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000349929), art. 2.

## C. GDPR

### L-05: Processors, transfers and what the privacy policy must name

The processors are listed under the facts above, plus a planned email sender (Amazon SES in Paris; Resend, which sends from Ireland but keeps account data in the US; or Postmark, with no EU servers), a billing provider, the Pwned Passwords API (I-61) and possibly a hosted feedback board (I-52). What transfer basis covers prompts sent to Anthropic and OpenAI, errors and replays sent to Sentry, and functions running in Washington, D.C.? Must the policy name each processor? Which of them need a signed DPA before launch?

- **Why it matters:** the privacy policy cannot be finalised, and the email provider cannot be chosen, without it.
- **Unblocks:** I-38 slice 6 (final wording) and slice 13, which is I-63 slice 7 (the processor entry); I-30 slices 5 and 7; I-39 slice 0; I-52's board; I-61 10.4.
- **Raised in / sources:** [I-38](specs/i38-trust-safety-and-user-rights.md#open-questions), [I-63](specs/i63-one-notification-system.md#open-questions), [I-52](specs/i52-feedback-loop-players-can-see.md#open-questions). [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj); Resend, [Choosing a Region](https://resend.com/docs/dashboard/domains/regions) and [DPA](https://resend.com/legal/dpa) (updated 2025-12-31); Vercel, [function regions](https://vercel.com/docs/functions/configuring-functions/region) (read 2026-11-10).

### L-06: Lawful bases and personal-data status of smaller processing

Which basis applies, and is each item personal data at all? (a) `AiUsage` rows recording each model call per user (I-30 4.8). (b) First-party product events tied to an account id: consent, or legitimate interest with notice and an opt-out (I-39)? (c) A bug report linked to an account, and whether consent suffices to copy its text into a public GitHub issue (I-52). (d) Help searches that found nothing, stored after a scrubber although a player may type personal data (I-64). (e) The five-character SHA-1 prefix of a password sent to Pwned Passwords (I-61). (f) A Discord user id held only in memory for rate limiting (I-46). (g) A link-only gift page showing card names and, optionally, a username (I-56). (h) Added 2026-11-10: a confirmed `ai_output` report turned into a public test case of the AI bench, with no user id and the brief rewritten by the owner. What consent and what rewriting does that need (I-70 10.4)?

- **Why it matters:** each item needs a line in the privacy policy, and some cannot ship without the answer.
- **Unblocks:** I-30 slice 1's notice; I-39 slices 10–11; I-52 slices 3 and 5; I-64 slice 7; I-61 slice 15; I-46 slice 6; I-56 slice 13; I-70 slice 15.
- **Raised in / sources:** [I-30 7.2](specs/i30-business-model-and-paid-tier.md#7-the-legal-gate), [I-39](specs/i39-first-run-activation-and-measurement.md#open-questions), [I-52](specs/i52-feedback-loop-players-can-see.md#open-questions), [I-64](specs/i64-help-centre-and-guidance.md#open-questions), [I-61](specs/i61-account-security.md#open-questions), [I-46](specs/i46-discord-and-chat-integrations.md#open-questions), [I-56](specs/i56-wishlists-friends-can-buy-from.md#open-questions), [I-70](specs/i70-ai-quality-bench-and-model-changes.md#open-questions). Have I Been Pwned, [API v3, Pwned Passwords](https://haveibeenpwned.com/API/v3#PwnedPasswords).

### L-07: Is a player's stats page or year in review profiling?

I-60 computes statistics across a player's own decks and an opt-in "Commander year in review", private by default, with optional public levels. Is either profiling under Article 4(4), and does each run on contract, legitimate interest or consent? If the recap opt-in is consent, does a French player under 15 need a parent's joint consent, and is a profile-level recap compatible with I-38's defaults for minors? Does the public level, which needs the player's own action and a second action for a private deck, meet Article 25(2)?

- **Unblocks:** I-60 slices 0, 4 and 6; until then, requirement 10.4 limits the profile level to accounts with a recorded age declaration.
- **Deadline:** the recap job runs at 00:00 UTC on 1 December, so a 2026 recap needs the answer before 2026-12-01.
- **Raised in / sources:** [I-60](specs/i60-player-stats-and-year-in-review.md#open-questions). GDPR [Art. 4(4)](https://gdpr-info.eu/art-4-gdpr/) and [Art. 25(2)](https://gdpr-info.eu/art-25-gdpr/); Article 29 Working Party, [wp251rev.01](https://ec.europa.eu/newsroom/article29/items/612053) (2018-08-22); CNIL, [Recommandation 4](https://www.cnil.fr/fr/recommandation-4-rechercher-le-consentement-dun-parent-pour-les-mineurs-de-moins-de-15-ans) (2021-06-09).

### L-08: Minors, the stated minimum age and adult-only features

I-38 avoids consent-based processing for accounts and makes defaults safe for teenagers (no private messages, ads, profiling, location or engagement email). (a) Which minimum age should the terms state, given that the account rests on contract and France sets 15 for consent? Is a single declaration with no birth date enough (DSA Art. 28(3))? (b) Where a feature does rest on consent (a recap opt-in, an email opt-in, a store guest's nickname, game-log contribution), is a parent's joint consent required under 15? (c) Is a feature-level "18 or older" declaration enough for adult-only features: a city opt-in for nearby trades and a store audience (I-44), a public profile audience and affiliate codes on wishlists (I-56)? (d) Is a city with its region, opted in and shown only to opted-in adults, proportionate under Arts. 5(1)(c) and 25?

- **Unblocks:** I-38 slice 7; I-44 slices 12–14; I-56 slices 8 and 13; I-60 slice 6; I-63 9.3; I-41 slice 6; I-35 slice 8; I-53 slice 17's eligibility.
- **Raised in / sources:** [I-38](specs/i38-trust-safety-and-user-rights.md#9-minors), [I-44](specs/i44-trade-lists-within-the-pod.md#open-questions), [I-41](specs/i41-store-commander-nights.md#open-questions), [I-63 9](specs/i63-one-notification-system.md#9-minors). [DSA](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065) Art. 28; Commission, [guidelines on the protection of minors](https://digital-strategy.ec.europa.eu/en/library/commission-publishes-guidelines-protection-minors) (2025-07-14, excluding micro and small enterprises); [DSA Observatory](https://dsa-observatory.eu/2025/07/30/do-the-dsa-guidelines-on-protecting-minors-online-strike-the-right-balance/) (2025-07-30, search summary); CNIL, [Recommandation 4](https://www.cnil.fr/fr/recommandation-4-rechercher-le-consentement-dun-parent-pour-les-mineurs-de-moins-de-15-ans); GDPR [Art. 25](https://gdpr-info.eu/art-25-gdpr/).

### L-09: People who are not users

Users will record other people. (a) Lending (I-51): a private label of up to 40 characters names a borrower with no account. Recital 18 exempts household activity but "applies to controllers or processors which provide the means". Is MagicAIBuilder that person's controller, owing them information? Is a hint enough, should labels expire after a loan closes, or should only "someone" be allowed? (b) Game logs (I-35): does an unnamed per-game opponent label keep the product outside Art. 14, and is a hint enough for free-text notes? (c) Store nights (I-41): is the store the controller of guests' nicknames and MagicAIBuilder its processor, or are they joint controllers? Which basis covers a nickname, and is a 24-hour purge right? (d) The deck index (I-29) stores no author handle from other sites unless a licence requires attribution: what basis would cover one, and does a privacy notice listing every source satisfy Art. 14(5)(b)?

- **Unblocks:** I-51 slices 2 and 4; I-35 slices 1–3; I-41 slice 6; I-29 slices 0 and 13.
- **Raised in / sources:** [I-51](specs/i51-cards-lent-and-borrowed.md#open-questions), [I-35](specs/i35-pod-game-log.md#open-questions), [I-41](specs/i41-store-commander-nights.md#open-questions), [I-29 1.6](specs/i29-cross-site-deck-index.md#1-source-policy-non-negotiable). GDPR [Recital 18](https://gdpr-info.eu/recitals/no-18/) and [Art. 14](https://gdpr-info.eu/art-14-gdpr/); CNIL, [scraping guidance](https://www.cnil.fr/en/node/165783) (2025-06-19); CNIL, [KASPR fine](https://cnil.fr/fr/aspiration-de-donnees-sanction-de-240-000-euros-lencontre-de-la-societe-kaspr) (2024-12-05).

### L-10: Retention periods

Are these proposed periods lawful, and what is missing? Accounts with no sign-in: deleted after 2 years with a 30-day warning. Signed-out notices with no decision: 6 months after closing. Moderation decisions and anonymised reports: 3 years. `AiUsage` rows: aggregated without the user id after 13 months. Bug reports: not yet set. A hash of a suppressed email address: kept after account deletion, for how long? Help searches that found nothing: not yet set. Billing records: the accountant's period. Store guest names: 24 hours (L-09).

- **Unblocks:** I-38 slices 6 and 14 (the retention job and its rendered table); I-30 4.8; I-52 slice 0; I-63 slice 7; I-64 slice 7; I-43's move history.
- **Raised in / sources:** [I-38 8](specs/i38-trust-safety-and-user-rights.md#8-retention), [I-63](specs/i63-one-notification-system.md#open-questions), [I-52](specs/i52-feedback-loop-players-can-see.md#open-questions), [I-30 7.2](specs/i30-business-model-and-paid-tier.md#7-the-legal-gate). CNIL, [comptes inactifs](https://cnil.fr/fr/achat-de-contenus-numeriques-quelle-duree-de-conservation-des-comptes-inactifs) (2025-09-18); CNIL, [outils de mesure d'audience](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience) (2025-07-04, 25 months at most).

### L-11: Data portability (Art. 20)

(a) Does Art. 20 support a player moving decks from another site with that site's export file (I-62), and does it cover a primer that quotes other people? (b) May any export of a player's own collection ever be paid (I-45 requirement 4.4 assumes no; I-30 1.2 keeps the player's own data free)? (c) Does the one-time, player-triggered import that I-29 2.2 rates low risk rely on Art. 20, and does the free JSON export of I-38 7 meet it?

- **Unblocks:** I-62 slices 0–11; I-45 slices 12–13; I-38 slice 4's schema; I-29 2.2.
- **Raised in / sources:** [I-62](specs/i62-switching-from-another-site.md#open-questions), [I-45 7](specs/i45-selling-spare-cards.md#7-legal-points-research-not-legal-advice). [GDPR Art. 20](https://eur-lex.europa.eu/eli/reg/2016/679/oj).

### L-12: Contributing games to published aggregates

A player may opt in to contribute logged games (I-35). A cell is published only with 40 or more games from at least 10 accounts and 5 pods, no pod above a third. Is consent the right basis for contribution? Do those thresholds meet the CNIL's three anonymisation criteria? Must a published figure be recalled after a player withdraws? The same reasoning covers I-29 and I-34 statistics, which never reproduce one deck.

- **Unblocks:** I-35 slices 8 and 9; I-34 slices 9–11 where they publish casual results.
- **Raised in / sources:** [I-35](specs/i35-pod-game-log.md#open-questions). GDPR [Art. 7](https://gdpr-info.eu/art-7-gdpr/); CNIL, [L'anonymisation de données personnelles](https://www.cnil.fr/fr/technologies/lanonymisation-de-donnees-personnelles) (2020-05-19); EDPB, [Guidelines 01/2025 on pseudonymisation](https://www.edpb.europa.eu/our-work-tools/documents/public-consultations/2025/guidelines-012025-pseudonymisation_en) (draft, 2025-01-16).

## D. ePrivacy and email

### L-13: Audience measurement, error replay and device reads

There is no cookie banner. (a) Do Sentry Session Replay, at 1% of sessions plus every session with an error, and Vercel Speed Insights fit the CNIL's audience-measurement exemption? If not: consent and a banner, or removal? (b) Does a first-party beacon sent from the browser fall under Art. 5(3) as EDPB Guidelines 2/2023 read it? If so, does the exemption cover an identifier-free counter? (c) Is a view counter keyed on a daily-salted hash of IP address and user agent personal data, and does it need consent or only notice (I-36)? (d) Is reading browser family, version and viewport when a player submits a bug report "strictly necessary" for a service the user "explicitly requested" (I-52)? (e) Would a hosted feedback board's cookies need consent?

- **Unblocks:** I-38 slice 6; I-39 slices 10, 11 (guest beacons) and 15; I-36 slice 12; I-52 slices 3 and 9; I-34 slice 8; I-05's analytics choice.
- **Raised in / sources:** [I-38](specs/i38-trust-safety-and-user-rights.md#open-questions), [I-39](specs/i39-first-run-activation-and-measurement.md#open-questions), [I-36](specs/i36-creator-and-embed-toolkit.md#open-questions), [I-52](specs/i52-feedback-loop-players-can-see.md#open-questions). CNIL, [outils de mesure d'audience](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies-solutions-pour-les-outils-de-mesure-daudience) (2025-07-04); EDPB, [Guidelines 2/2023](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-22023-technical-scope-art-53-eprivacy-directive_en) (v2.0, 2024-10-16); [Directive 2002/58/EC Art. 5(3)](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:02002L0058-20091219).

### L-14: Are notices the player turned on prospection?

The product will send no marketing email (I-63 1.2), and every activity email is off by default. A player may turn on rules-change notices (I-48), price alerts (I-59), loan reminders (I-51), a "recap is ready" email (I-60) or request updates (I-52). Are these service messages outside the prospection rule of CPCE L34-5? If any is prospection, the sources disagree on the soft opt-in. The CNIL wrote on 2026-06-10 that a free account is not a customer. The CJEU held in _Inteligo Media_ (C-654/23, 2025-11-13) that a free account steering users to paid content can be a "sale" under ePrivacy Art. 13(2). Is the opt-in itself GDPR consent, bringing in a parent's joint consent under 15 (L-08)? Added 2026-11-10 from I-73: is a release digest that names a new commercial product, a set and its Commander decks, prospection even when the player opted in to it?

- **Unblocks:** I-63 slices 3 and 8; I-48's email; I-59 slice 13; I-51 slice 17; I-60 open question 3; I-44 slice 16; I-73 slice 7's digest by email.
- **Deadline:** none dated. I-48 wants its email live for the Commander announcement Wizards called "likely" before the end of 2026.
- **Raised in / sources:** [I-63](specs/i63-one-notification-system.md#open-questions), [I-48](specs/i48-official-changes-reach-every-deck.md#open-questions), [I-59](specs/i59-prices-over-time-and-alerts.md#open-questions), [I-73](specs/i73-every-set-release-ready-on-day-one.md#open-questions) 3 (c). CNIL, [La prospection commerciale par courrier électronique](https://www.cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique) (dated 2026-06-10); Matheson, [on C-654/23 _Inteligo Media_](https://www.matheson.com/insights/cjeu-clarifies-direct-marketing-rules-under-eprivacy-directive/) (2025-12-12); [Directive 2002/58/EC](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02002L0058-20091219).

### L-15: The legal basis for security email

Password reset, email verification, email change and new sign-in notices go out on a transactional stream, cannot be turned off and name the device, country and time but never the IP address. What is their legal basis? Can they ship once the privacy policy's processor entry exists, before the rest of I-38's legal answers?

- **Why it matters:** today no account can reset its password, and linking Google from settings waits for email verification, because no sender exists.
- **Unblocks:** I-61 slices 11–14; I-63 slice 7 (I-38 slice 13); I-38 slices 14–15; I-30 6.5 and 6.7's confirmation and reminder emails.
- **Raised in / sources:** [I-61](specs/i61-account-security.md#open-questions), [I-63](specs/i63-one-notification-system.md#open-questions). CNIL, [Mots de passe](https://www.cnil.fr/fr/mot-de-passe) (2022-10-14).

## E. Intellectual property and database rights

### L-16: Does a paid tier fit Wizards' Fan Content Policy?

The policy says "Free means FREE: You can't require payments, surveys, downloads, subscriptions, or email registration to access your Fan Content", allows "sponsorships, ad revenue, and donations", and lets Wizards withdraw permission "for any reason or no reason". (a) Does a tier that gates only computation, AI use above an allowance and personal tools amount to "subscriptions … to access your Fan Content"? Card data, deck pages, guides and evidence would stay free. (b) Is paid early access compatible? (c) Does each candidate pass: Deck Lab runs (I-31), paid comparisons against free norms (I-34), game-log analysis (I-35), creator analytics (I-36), bulk scanning (I-40), a store plan sold to businesses (I-41), cross-deck land allocation (I-58), an automatic radar for every deck at each set release (I-73), alerts on more saved deck searches than a free allowance (I-75; both added 2026-11-10)? (d) Should the owner seek a direct Wizards licence first? (e) The footer cites the old "Fan Site Policy": what notice does a paid product need?

- **Why it matters:** no public Wizards ruling on paid deckbuilding tools was found; paid MTG tools exist as tolerated practice. Billing does not ship before this answer.
- **Unblocks:** I-30 slices 6–11, or slice 12 if the answer is no; the paid line of I-07/I-21, I-16, I-18, I-31, I-34, I-35 (slice 7), I-36 (slice 13), I-40, I-41, I-47 (slice 13), I-51 (slice 18), I-54 (slice 14), I-58 (slice 15), I-59 (slice 13), I-60 (slice 14), I-65 (slice 16), I-73 (slice 12) and I-75 (slice 12).
- **Raised in / sources:** [I-30 7.2](specs/i30-business-model-and-paid-tier.md#7-the-legal-gate), [I-29 7.2–7.3](specs/i29-cross-site-deck-index.md#7-monetization-constraints) (its research's question 9), [I-31](specs/i31-deck-lab.md#open-questions), [I-34](specs/i34-commander-data-reports.md#open-questions), [I-36](specs/i36-creator-and-embed-toolkit.md#open-questions), [I-41](specs/i41-store-commander-nights.md#open-questions). Wizards, [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy) (updated 2017-11-15); [competitive landscape](competitive-landscape.md#what-players-pay-for).

### L-17: Affiliate links, sponsorships and donations under the Fan Content Policy

(a) The policy names sponsorships, ad revenue and donations, not affiliate links. Are affiliate links "ad revenue"? EDHREC, which carries the fan-content notice, discloses affiliate links in its terms. (b) May a challenge carry a sponsor's credit "acting as a sponsor only" (I-53)? (c) May a supporter page with a badge and nothing gated fund the product? (d) For a marketplace pilot (I-33), does a listing that shows card images fit the policy?

- **Unblocks:** I-32 slices 6–7; I-30 slice 12 (the fallback); I-33 stages 1–5; I-45's referral line; I-53 slice 16; I-56 slice 8.
- **Raised in / sources:** [I-29 7.6](specs/i29-cross-site-deck-index.md#7-monetization-constraints), [I-32 Q4](specs/i32-seller-handoff-and-affiliate-carts.md#open-questions), [I-33](specs/i33-marketplace-ladder.md#open-questions). Wizards, [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy); EDHREC, [Terms](https://edhrec.com/terms) (effective 2024-08-06); Mana Pool, [Affiliates](https://manapool.com/affiliates).

### L-18: The Comprehensive Rules and Wizards' rulings

The app already serves the Comprehensive Rules text verbatim, and the file ends "All Rights Reserved"; I-34 slice 2 would make `/rules/comprehensive` public but `noindex`. (a) May the app serve it, and keep each old version it cites (about 1 MB each), under the Fan Content Policy? (b) May Wizards' rulings, received through Scryfall, appear on public deck pages? (c) Added 2026-11-12: may a printed pilot sheet, for the player's own use, quote the triggering clause of each card (at most 140 characters) beside the card's name, with no image and no full Oracle text, as the proxy sheet's names already do ([I-99](specs/i99-a-pilot-sheet-and-how-heavy-this-deck-is-to-pilot.md#open-questions) 5)? Recommended until answered: ship the on-screen sheet; print clause excerpts only after the answer, or names and step headings alone if the answer is no.

- **Unblocks:** I-47 slices 1–7; I-34 slice 2; glossary links from I-27 and I-64; the printed clause excerpts of I-99 slice 5 (c).
- **Raised in / sources:** [I-47](specs/i47-rules-answers-for-this-deck.md#open-questions), [I-99](specs/i99-a-pilot-sheet-and-how-heavy-this-deck-is-to-pilot.md#open-questions) (c). Wizards, [Magic rules](https://magic.wizards.com/en/rules) ([CR effective 2026-11-06](https://media.wizards.com/2026/downloads/MagicCompRules%2020261106.txt)); Scryfall, [Rulings Objects](https://scryfall.com/docs/api/rulings).

### L-19: The card back, card art and artist credit

(a) May a free export to Tabletop Simulator use the Magic card back? The spec draws its own back until then. (b) May a share image combine a Scryfall-served art crop with the product's own text (deck pages, I-60's recap images)? Must every art crop name its artist? An audit found Discord previews of deck links showing art with no artist credit.

- **Unblocks:** I-50 slice 7; I-36 slice 2; I-60 slices 5 and 7; I-46's preview fix.
- **Raised in / sources:** [I-50](specs/i50-play-this-deck-online.md#open-questions), [I-36](specs/i36-creator-and-embed-toolkit.md#open-questions). Scryfall, [API documentation](https://scryfall.com/docs/api) (image rules); Wizards, [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy).

### L-20: Is a paid tool over Scryfall data "paywalling" it?

Scryfall's terms: "You may not 'paywall' access to Scryfall data … end-users should be able to access card data anonymously or with free accounts." The prices and rulings would stay free on every page. Are these paywalling? Price alerts, deck cost history, a cart optimizer and a price watch (I-30, I-32, I-59). A collection value history and snapshot archive (I-45). A rules watch over Scryfall rulings (I-47). A paid bulk scanning mode (I-40). Separately, does a buylist threshold or a listing sheet power "a storefront or sales system" (I-45)? Scryfall should be asked in writing as well.

- **Unblocks:** I-32 slice 12; I-45 slices 12–13; I-59 slice 13; I-47 slice 13; I-40's bulk mode; I-56 slice 18; I-30's price candidates.
- **Raised in / sources:** [I-30 7.2](specs/i30-business-model-and-paid-tier.md#7-the-legal-gate), [I-32 Q3](specs/i32-seller-handoff-and-affiliate-carts.md#open-questions), [I-45 L1](specs/i45-selling-spare-cards.md#7-legal-points-research-not-legal-advice), [I-47](specs/i47-rules-answers-for-this-deck.md#open-questions), [I-59](specs/i59-prices-over-time-and-alerts.md#open-questions). Scryfall, [API documentation](https://scryfall.com/docs/api) (read 2026-11-10) and [Bulk data](https://scryfall.com/docs/api/bulk-data).

### L-21: Proxying, repackaging and our own API terms (Scryfall)

Scryfall: "You may not simply repackage, republish, or proxy Scryfall data. Your software must create additional value." (a) The shipped route `/api/proxy-card-image` streams `cards.scryfall.io` images to the browser for print and PDF, because the CDN blocks cross-origin fetches. Is that proxying? (b) Is a stored price chart shown only beside the player's own cards clear (I-59)? (c) Does a Discord `/card` reply add value (I-46)? (d) May the planned public read API require attribution and forbid resale when its responses contain Scryfall-derived fields? Its terms page is to be lawyer-reviewed (I-36 7.5). (e) May a card-recognition index derived from Scryfall images be built, served to browsers and used by a paid mode? The art itself belongs to Wizards (I-40). (f) Added 2026-11-11: is an MCP adapter that answers a player's own assistant with verification verdicts citing Scryfall card data "proxying" (I-22, D-54)? (g) Added 2026-11-12: is a private checklist of a set's or one card's printings, built from I-67's copy of Scryfall's bulk data and shown only to the collector who owns the rows, "repackaging", and does a `noindex` share page that shows the same list when the owner ticks it change the answer ([I-101](specs/i101-collecting-goals-beyond-a-set.md#open-questions) 4)? Recommended until answered: private pages only; the share page shows progress numbers and withholds the missing list.

- **Unblocks:** I-50's print path; I-59's charts; I-46's card command; I-36 slice 11; I-40 slice 7, then slices 8–12; I-22's MCP adapter; I-101 slice 9's share page (g).
- **Raised in / sources:** [I-50](specs/i50-play-this-deck-online.md#open-questions), [I-59](specs/i59-prices-over-time-and-alerts.md#open-questions), [I-46](specs/i46-discord-and-chat-integrations.md#open-questions), [I-36](specs/i36-creator-and-embed-toolkit.md#open-questions), [I-40](specs/i40-installable-app-and-card-scanning.md#open-questions), [I-101](specs/i101-collecting-goals-beyond-a-set.md#open-questions) (g). Scryfall, [API documentation](https://scryfall.com/docs/api), [terms](https://scryfall.com/docs/terms).

### L-22: Scryfall's Tagger tags

Scryfall's bulk data includes an "Oracle Tags" file "sourced from Tagger": 4,617 tags on 36,453 Oracle IDs in the file of 2026-11-09. Scryfall calls the tags "community-maintained", and no licence was found. May the product show card roles and play styles derived from them, with attribution? Without them, definitions fall back to less precise Oracle-text patterns. Scryfall should be asked in writing. Added 2026-11-11: I-78's table-effect classes (symmetrical, group-slug, punisher, pillowfort, monarch-matters and others) are another use, and the punisher class has no Oracle-text definition without them.

- **Unblocks:** I-37 slice 18; I-54's play styles (slice 2); I-65 slice 8, which is blocked for release; I-78 slice 8, blocked for release on the same answer.
- **Raised in / sources:** [I-30 7.2](specs/i30-business-model-and-paid-tier.md#7-the-legal-gate), [I-54](specs/i54-find-your-next-commander.md#open-questions), [I-65](specs/i65-how-this-deck-wins.md#open-questions), [I-37](specs/i37-editor-depth.md#open-questions). Scryfall, [bulk data](https://scryfall.com/docs/api/bulk-data) (files dated 2026-11-09).

### L-23: Commander Spellbook's combo data

Spellbook's code is MIT, but no licence for its combo data was found. Its API asks for "sparse, unauthenticated requests", credit and a link back, and its backend's robots.txt is `Disallow: /`. The product already shows Spellbook combos (one cached lookup per deck). What more does it need to: show Spellbook's bracket estimate in the index; use the data in a public "State of the Brackets" report; group Spellbook variants into win routes with their speed band; answer a Discord `/combo` command? The maintainers, under Space Cow Media, should be asked.

- **Unblocks:** I-29 slice 8; I-34 slice 11; I-65 slices 2–4 and open question 5; I-46 slice 10; the shipped I-09 combos panel.
- **Raised in / sources:** [I-29](specs/i29-cross-site-deck-index.md#open-questions), [I-65](specs/i65-how-this-deck-wins.md#open-questions), [I-34](specs/i34-commander-data-reports.md#delivery-slices). Commander Spellbook, [API schema](https://backend.commanderspellbook.com/schema/) (v7.3.6); [backend code](https://github.com/SpaceCowMedia/commander-spellbook-backend).

### L-24: EDHREC, the cross-site index and the database right

I-29 indexes only decks the product may lawfully hold and links out to other sites without fetching them. (a) What database-right status does each source have (EDHREC, Moxfield, Archidekt, Cardmarket's price guide)? Does _Innoweb_ bar any live query behind the link-out row? (b) I-09 reads `json.edhrec.com` server-side when its 24-hour cache expires. EDHREC's terms allow "personal, noncommercial use" and forbid "automated searches, requests, or queries". Is that read within them? Must it, and any non-commercial source, stay out of every paid feature? (c) Are robots.txt, TDMRep, ai.txt, `noai` and `Content-Signal` the right machine-readable reservations under DSM Art. 4(3)? (d) Is a checkbox warranty enough to index a deck imported from another site, or must a code in the source deck prove ownership? (e) What must a partnership agreement cover: commercial use, caching, retention, attribution and GDPR controller roles? (f) May aggregates keyed by card names and Scryfall Oracle IDs be released under CC BY 4.0 (I-34)? (g) May I-58 propose utility lands from EDHREC's per-commander list? (h) Added 2026-11-11: may EDHREC salt be shown, credited, under a partnership (I-78, I-29 slice 13), and must salt and I-76's EDHREC inclusion column stay out of every paid feature?

- **Unblocks:** I-29 slices 0, 5, 6, 11 and 13; I-09's EDHREC reads; I-34 slices 4 and 9–11; I-58 open question 2; I-31's norms; I-78 slice 9; I-76 slice 16 on paid surfaces.
- **Raised in / sources:** [I-29](specs/i29-cross-site-deck-index.md#open-questions), [I-30 7.2](specs/i30-business-model-and-paid-tier.md#7-the-legal-gate), [I-34 6.7](specs/i34-commander-data-reports.md#open-questions), [I-58](specs/i58-mana-base-builder.md#open-questions), [I-45 L2](specs/i45-selling-spare-cards.md#7-legal-points-research-not-legal-advice). CJEU [_Innoweb_, C-202/12](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62012CJ0202) (2013-12-19) and [_GS Media_, C-160/15](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62015CJ0160); [DSM Directive Art. 4(3)](https://eur-lex.europa.eu/eli/dir/2019/790/oj); EDHREC, [Terms](https://edhrec.com/terms) (2024-08-06).

### L-25: Terms of the other data sources

(a) MTGTop8: its terms were not reviewed, although I-09 already reads it, and I-42 wants Duel Commander metagame labels. (b) TopDeck.gg's developer terms (§7) forbid commercialising API data. (c) A Rennes Duel Commander project publishes GPL-3.0 code and no data licence. (d) May the first 90 days of price history come from MTGJSON's AllPrices, or does its MIT licence not reach the provider prices inside? (e) Card Kingdom's public buylist price list publishes no terms. (f) What are the terms of Cardmarket's daily price guide file, the only EUR source besides Scryfall? (g) Do TCGplayer's API terms reach the USD prices Scryfall relays? (h) JustTCG's licence for stored data ends with the subscription.

- **Unblocks:** I-42 slice 5 and open question 3; I-09's tournament statistics; I-59's seed; I-45 slices 11–13; I-32 slices 2–3 for the EU market.
- **Raised in / sources:** [I-42](specs/i42-commander-variants-duel-cedh-pauper.md#open-questions), [I-59](specs/i59-prices-over-time-and-alerts.md#open-questions), [I-45](specs/i45-selling-spare-cards.md#open-questions), [I-32 Q4](specs/i32-seller-handoff-and-affiliate-carts.md#open-questions). [MTGTop8](https://www.mtgtop8.com/format?f=EDH); TopDeck.gg, [Developer Terms](https://topdeck.gg/developer-terms) (effective 2026-10-27); MTGJSON, [License](https://mtgjson.com/license/); Card Kingdom, [price list](https://api.cardkingdom.com/api/v2/pricelist); Cardmarket, [price guide file](https://downloads.s3.cardmarket.com/productCatalog/priceGuide/price_guide_1.json) and [announcement](https://news.cardmarket.com/en/FoW/adding-non-singles-and-accessories-to-the-price-guide) (2024-10-28); JustTCG, [Terms](https://justtcg.com/terms) (2026-11-04).

## F. Competitors' terms

### L-26: Archidekt's clauses

The shipped single-deck Archidekt import fetches `archidekt.com/api/decks/{id}/` when a player pastes a link. Archidekt's terms (effective 2018-09-07) name Archidekt LLC as owner and forbid "automated searches, requests, or queries" and access "to build a similar or competitive website". EDHREC's terms share the template, and both sit under Space Cow Media. Do these terms bind MagicAIBuilder, which never accepted them, given that _Ryanair_ (C-30/14) lets terms bind the account holder? What exposure does the shipped fetch carry? What should the owner's letter to Archidekt LLC and Space Cow Media ask, so one answer also covers the I-29 partnership?

- **Unblocks:** I-10's owner decision on the Archidekt import; I-62 slice 19 (files only until then); I-29 slice 13.
- **Raised in / sources:** [roadmap I-10](roadmap.md#i-10-interoperability-and-integrations), [I-62](specs/i62-switching-from-another-site.md#open-questions). Archidekt, [Terms](https://archidekt.com/terms) (read 2026-11-10); CJEU, [_Ryanair_, C-30/14](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62014CJ0030) (2015-01-15); [competitive landscape](competitive-landscape.md#how-the-references-grew).

### L-27: The Moxfield block and the no-circumvention line

Moxfield answered the app's honest requests with a Cloudflare block (HTTP 403) on 2026-11-09. Its terms reportedly prohibit scraping; the page itself answers 403. Until #1304 (merged 2026-11-09), the import sent `Origin` and `Referer` headers set to `moxfield.com`. It now stops at a refusal and asks the player to paste the list. (a) Is I-29's line right under French criminal law and contract: never bypass a block, stop at a 403 and never retry by another route (_Bluetouff_)? (b) Does the earlier header practice leave any exposure that needs action? (c) Is accepting a pasted Moxfield list clear? (d) What may a request to Moxfield for an API, a bulk export or a partnership safely cover?

- **Unblocks:** I-10's owner decision on the Moxfield route; I-62 open question 2 and slice 8; I-29 slices 0 and 13.
- **Raised in / sources:** [roadmap I-10](roadmap.md#i-10-interoperability-and-integrations), [I-29 open questions](specs/i29-cross-site-deck-index.md#open-questions). [_Bluetouff_, Cass. crim. 2015-05-20](https://next.ink/18233/95165-affaire-bluetouff-cour-cassation-consacre-vol-fichiers-informatiques/); [Moxfield robots.txt](https://moxfield.com/robots.txt).

### L-28: Files exported from other sites, and naming competitors

(a) The product will accept files a player exported from another site (I-62, I-26), and send no request to that site. Does that expose the product if the site's terms forbid copying or access "to build a similar or competitive website"? (b) May the switching guides name competitors and describe their export menus? (c) How may platform names such as Magic Online, Arena, Tabletop Simulator and Cockatrice appear in the export interface (I-50)?

- **Unblocks:** I-62 slices 0–11 and its guides; I-26's imports; I-50's export panel.
- **Raised in / sources:** [I-62](specs/i62-switching-from-another-site.md#open-questions), [I-26](specs/i26-collections-arriving-from-elsewhere.md#open-questions), [I-50](specs/i50-play-this-deck-online.md#open-questions). Archidekt, [Terms](https://archidekt.com/terms); [_Ryanair_, C-30/14](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:62014CJ0030).

## G. Contests and prizes

### L-29: Deckbuilding challenges and lottery law

I-53 runs monthly challenges that the product's own checks validate, with recognition first. (a) Is a recognition-only challenge outside lottery and contest law? (b) With a prize, does a free account count as no financial sacrifice while a paid tier exists (L322-2-1)? (c) Which territories and minimum age apply? Archidekt requires 18 and excluded Quebec in 2023. (d) May a community vote decide any prize, or only judges? (e) Would a random prize draw among paying entrants at a store night be a lottery (I-41 excludes draws for this reason)?

- **Unblocks:** I-53 slices 0 and 17; I-41 requirement 1.3.
- **Raised in / sources:** [I-53](specs/i53-monthly-deckbuilding-challenges.md#open-questions), [I-41](specs/i41-store-commander-nights.md#open-questions). Squire Patton Boggs, [Notion de loterie](https://larevue.squirepattonboggs.com/notion-de-loterie-nouvelle-definition-introduite-par-la-loi-hamon_a2309.html) (2014-04-14; check current article numbers); Olshan, [Popularity contests](https://www.olshanlaw.com/newsroom/publications/Popularity-Contests-Consumer-Vote); Archidekt, [contest rules](https://archidekt.com/contestRules) and [June 2023 contest](https://archidekt.com/news/4773772).

### L-30: Sponsor credits and store credit

(a) How must a sponsor's text credit on a challenge be labelled under French advertising law? Is a credit without tracking still "advertising" for I-38's no-ads default for minors? (b) Who owes tax on store credit given as a prize? WPN warns that "Legal restrictions vary by region" for store credit.

- **Unblocks:** I-53 slices 16 and 17.
- **Raised in / sources:** [I-53](specs/i53-monthly-deckbuilding-challenges.md#open-questions). WPN, [How to prize your Magic events](https://wpn.wizards.com/en/news/how-to-prize-your-magic-events-for-maximum-impact) (2025-08-27); [LCEN art. 20](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000018048180).

## H. Marketplace, payments and lending between users

Lending (I-51) moves no money; its only lawyer question is [L-09](#l-09-people-who-are-not-users)(a).

### L-31: Disclosing affiliate links, including to minors' relatives

(a) Do LCEN article 20 and L121-4 11° require a label on each affiliate link, and is I-32 requirement 1.1's wording enough? (b) Does that label suffice on a wishlist gift page read by relatives who have no account (I-56)? (c) Does it apply unchanged on the sell side (I-45)? (d) Is an affiliate-coded seller link on a gift page whose owner may be a minor advertising aimed at minors? Is I-56's blanket rule (no code without an adult declaration) needed or too strict? (e) Does loi 2023-451, as rewritten by ordinance 2024-978, reach a tool's interface, or only creator content (I-36)?

- **Unblocks:** I-32 slices 6–7; I-56 slice 8; I-45's referral line; I-36's creator content; I-33 stage 1.
- **Raised in / sources:** [I-32 Q1–Q2](specs/i32-seller-handoff-and-affiliate-carts.md#open-questions), [I-56](specs/i56-wishlists-friends-can-buy-from.md#open-questions), [I-45 L6](specs/i45-selling-spare-cards.md#7-legal-points-research-not-legal-advice). Légifrance: [LCEN art. 20](https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000018048180), [L121-4](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044563107), [Loi 2023-451](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047663185); Dalloz, [Ordonnance 2024-978](https://www.dalloz-actualite.fr/document/ord-n-2024-978-6-nov-2024-jo-7-nov) (search summary).

### L-32: Seller lists, seller files and platform-operator status

(a) Does showing a list of sellers with prices make MagicAIBuilder an online platform operator under L111-7, triggering D111-6's ranking disclosures? (b) Do the DSA's advertising duties apply to a small hosting service with public decks? The research did not verify the small-enterprise exemption. (c) Does producing a file a player uploads to a buyer or marketplace make the product an intermediary under the DSA or L111-7, or bring DAC7 duties? The research's inference is no, because the sale happens on the buyer's platform.

- **Unblocks:** I-32 slices 0–1 (registry, disclosure page and ordering); I-45 slices 2–3.
- **Raised in / sources:** [I-32 Q2](specs/i32-seller-handoff-and-affiliate-carts.md#open-questions), [I-45 L5](specs/i45-selling-spare-cards.md#7-legal-points-research-not-legal-advice). Légifrance, [D111-6](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000035732365); INC, [plateformes en ligne](https://www.inc-conso.fr/node/10164) (on L111-7).

### L-33: Trade matching between players

I-44 matches players' have and want lists, card for card; no money passes through the product. (a) DAC7 makes platforms report sellers' consideration, and UK guidance treats barter as consideration. Does matching make MagicAIBuilder a reporting platform operator? Does deleting matched cards and never storing totals change that? (b) Can trader traceability (DSA Art. 30) or seller-status disclosure reach an individual who trades often, when no distance contract is concluded through the product?

- **Unblocks:** I-44 slices 12–14; matching and proposals (slices 6 and 9) are designed around the answer.
- **Raised in / sources:** [I-44](specs/i44-trade-lists-within-the-pod.md#open-questions). HMRC, [IEIM901710](https://www.gov.uk/hmrc-internal-manuals/international-exchange-of-information/ieim901710) (2026-10-15; the EU directive's text was not read); [DSA](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065).

### L-34: A professional-only marketplace pilot (stage 5)

Not before the owner records a "go". (a) Is a solo-run pilot a micro or small enterprise under DSA Art. 29, exempting it from Arts. 30–32? (b) Does a pilot with professional sellers only escape L111-7? (c) Which GPSR and toy-safety duties apply to single cards? (d) Which P2B and VAT deemed-supplier rules apply? (e) Confirm that funds must sit with a licensed provider such as Stripe Connect or Mangopay: the EBA and BaFin read marketplaces as outside PSD2's commercial-agent exclusion, and PSD3/PSR tightens it.

- **Unblocks:** I-33 slice 6 and gate 4→5 condition (d).
- **Raised in / sources:** [I-33](specs/i33-marketplace-ladder.md#open-questions), [competitive landscape](competitive-landscape.md#the-marketplace-path). [DSA Art. 29](https://www.eu-digital-services-act.com/Digital_Services_Act_Article_29.html) (transcription); Omnibus Art. 6a ([HSF Kramer](https://www.hsfkramer.com/notes/tmt/2020-07/omnibus-directive-a-new-deal-for-eu-consumers-part-3)); DAC7 ([CMS](https://cms.law/fr/fra/a-la-une/dac-7-le-renforcement-de-la-cooperation-fiscale-pour-les-plateformes-numeriques)); GPSR ([Osborne Clarke](https://www.osborneclarke.com/insights/navigating-eus-new-gpsr-obligations-are-introduced-online-marketplaces)); P2B ([2019/1150](https://www.legislation.gov.uk/eur/2019/1150/contents/adopted)); EBA, [Q&A 2020_5354](https://www.eba.europa.eu/single-rule-book-qa/qna/view/publicId/2020_5354); PSD3/PSR ([Stripe](https://stripe.com/en-de/guides/what-platforms-and-marketplaces-can-expect-from-psd3)).

## I. Liability for wrong answers

### L-35: Rules notes, model-picked help articles and value estimates

(a) I-47 publishes interaction notes reviewed by a certified judge, labelled with reviewer and date, beside official rulings. Who answers for an error quoted at a table, and do the labels suffice? Does a later, optional model that retrieves rules citations (slice 14) change that? (b) If a model picks the wrong help article for a cancellation or withdrawal question (I-64 slice 15), could that engage liability under French consumer law, as _Moffatt v. Air Canada_ did in Canada? (c) Could "estimated value" in a collection inventory report be read as an appraisal, and is its disclaimer enough (I-45)?

- **Unblocks:** I-47 slices 9–11 and 14; I-64 slice 15; I-45 slice 6.
- **Raised in / sources:** [I-47](specs/i47-rules-answers-for-this-deck.md#open-questions), [I-64](specs/i64-help-centre-and-guidance.md#open-questions), [I-45 L4](specs/i45-selling-spare-cards.md#7-legal-points-research-not-legal-advice). WeirFoulds, [Moffatt v Air Canada](https://www.weirfoulds.com/moffatt-v-air-canada-bot-betrayal-and-negligent-misrepresentation) (2024-03-06, on 2024 BCCRT 149).

## J. Accessibility

### L-36: The European Accessibility Act

The Act covers "e-commerce services" and exempts microenterprises providing services (under 10 people and €2 million). Would a paid subscription make the product an e-commerce service, and would the exemption apply to a sole operator? I-49 ships its colour and contrast fixes whatever the answer.

- **Unblocks:** whether WCAG conformance (I-04, I-24, I-49) becomes a legal duty at the paid launch, including the checkout.
- **Deadline:** the Act has applied since 2025-06-28.
- **Added 2026-11-10 (ninth pass):** when checkout is hosted by a merchant of record, whose "e-commerce service" is it under the Act? Does the microenterprise exemption still cover the owner's own pages? A voluntary accessibility statement built from the six WCAG 2.2 AA audit bundles is planned either way ([I-49](roadmap.md#i-49-a-display-that-works-for-colour-blind-and-low-vision-players)).
- **Raised in / sources:** [I-49](specs/i49-colour-vision-and-low-vision-display.md#open-questions). [Directive (EU) 2019/882](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32019L0882), Arts. 2(2)(f), 3, 4(5), 31(2), Annex I.

## K. The Digital Services Act and French host law

### L-37: Platform status and the micro-enterprise floor

The product hosts public decks, primers, comments, reviews, profiles and share links. (a) Is it an "online platform" or only a hosting service (Art. 3)? (b) Is it a micro enterprise while one person runs it, and how does the 12-month tail of Art. 19 work? I-38 reads the duties left as Arts. 11–18 and 24(3). (c) Does Art. 25 on deceptive design bind it at that size, or only the UCPD and the GDPR (I-39)? (d) Added 2026-11-10 from I-75: deck search explains on a public page which signals each order uses and why, as Art. 27(2) asks of platforms, while Art. 19(1) exempts micro and small enterprises from that section. Is that voluntary page enough at this size?

- **Unblocks:** I-38 slices 1 and 7–11; I-39 requirement 7; I-30 8.1's user-count metric; I-75 requirement 5.8.
- **Deadline:** none dated; if I-38's reading is right, the floor applies to the content already hosted today.
- **Raised in / sources:** [I-38](specs/i38-trust-safety-and-user-rights.md#open-questions), [I-39](specs/i39-first-run-activation-and-measurement.md#open-questions), [I-75](specs/i75-finding-public-decks.md#open-questions) 7. [DSA](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065); Commission, [SME definition](https://single-market-economy.ec.europa.eu/smes/sme-fundamentals/sme-definition_en); Arcom, [SREN press release](https://www.arcom.fr/en/press/arcom-delighted-promulgation-law-aimed-securing-and-regulating-digital-space-which-designates-it-coordinator-digital-services-france) (2024-05-22).

### L-38: LCEN duties of an individual operator

(a) What must the legal notice show when the publisher is an individual (LCEN Art. 1-1), and does running a paid tier make him a professional publisher? (b) Which contributor identification data must a host keep under LCEN Art. 6 V A and décret 2021-1362, and for how long? How does that coexist with erasure on account deletion? I-38 6.5 proposes a restricted store with its own expiry.

- **Unblocks:** I-38 slice 1 (the identity fields), slices 3, 6 and 14.
- **Raised in / sources:** [I-38](specs/i38-trust-safety-and-user-rights.md#open-questions). [LCEN](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000801164), Arts. 1-1 and 6; [Décret 2021-1362](https://www.dalloz-actualite.fr/document/decr-n-2021-1362-20-oct-2021-jo-21-oct) (retention periods not read).

### L-39: Notice-and-action design checks

(a) Art. 16(1) opens notices to any individual. May a signed-out notice require an email confirmation before it reaches the queue? (b) Recital 14 says information shared in a group is "dissemination to the public" only when members join "without a human decision". Are friends and pod lists therefore outside it, while share links, stores and nearby audiences are inside (I-44)? (c) Which licence must the terms take for public content, and may that content stay after its author leaves? I-38 deletes it. (d) Does Art. 16(6)'s "timely" handling require a stated response time in the terms? (e) Added 2026-11-10 from I-75: a moderator who excludes manipulated saves, votes or copies from a deck's counts demotes it in search. Is that a visibility restriction under Art. 17(1)(a) that needs a statement of reasons to the author?

- **Unblocks:** I-38 slices 7–11; I-44's audiences (slices 3, 6, 8, 13 and 14); I-75 slice 8.
- **Raised in / sources:** [I-38](specs/i38-trust-safety-and-user-rights.md#open-questions), [I-44](specs/i44-trade-lists-within-the-pod.md#open-questions), [I-75](specs/i75-finding-public-decks.md#open-questions) 7. [DSA](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2065), Arts. 16–17; [Recital 14](https://www.eu-digital-services-act.com/Digital_Services_Act_Preamble_11_to_20.html) (transcription); Discourse, [DSA page](https://discourse.org/dsa).

## L. The AI Act, selling terms and operations (added 2026-11-10)

The ninth research pass of 2026-11-10 swept the whole roadmap for gaps and added I-69 to I-71. L-40 to L-46 come from that sweep, L-47 from [I-69](specs/i69-operator-console-support-moderation-and-kill-switches.md#open-questions) and L-48 from [I-71](specs/i71-speed-uptime-and-recovery.md#open-questions). The sweep's notes are not committed, so each entry cites its sources. Research, not legal advice.

### L-40: The AI Act's transparency duties (Art. 50)

Sources read on 2026-11-10 agree that Article 50 of the AI Act applies from 2026-08-02, and that the AI Omnibus gave generative systems already on the market before that date until 2026-12-02 for machine-readable marking (Art. 50(2)). They disagree on whether the Omnibus text is formally adopted, so check the Official Journal text. The copilot is live, labels its output "AI Suggestions" (`src/messages/en/deck.json`) and has no disclosure page. (a) When the copilot is built on Anthropic and OpenAI models and offered under the product's own name, is MagicAIBuilder a "provider" of an AI system or only a deployer? (b) Do the visible "AI Suggestions" labels meet Art. 50(1), or is the AI nature "obvious from the context"? (c) Does Art. 50(2) marking cover generated deck lists, explanations and AI-drafted primer text, and does the 2026-12-02 date apply to a system on the market before 2026-08-02? (d) Is there any relief for a micro enterprise?

- **Why it matters:** a search summary of a secondary source gives fines of up to €15 million or 3% of turnover.
- **Unblocks:** I-30 slice 5, the AI-use disclosure page and its map of model surfaces; the `ai` origin field on saved items and in every export; the label on public AI-built decks; I-02 requirement 6.
- **Deadline:** 2026-12-02 for machine-readable marking, if the grace period applies; Art. 50(1) has applied since 2026-08-02.
- **Raised in / sources:** the ninth pass's gap sweep ([roadmap, 2026-11-10](roadmap.md#backlog-snapshot---2026-10-20)). Goodwin, [Not Delayed, Not Deferred: EU AI Act Transparency Obligations Are Now in Force](https://www.goodwinlaw.com/en/insights/publications/2026/08/alerts-technology-dpc-eu-ai-act-transparency-obligations-now-in-force) (2026-08-03); FEDIL, [AI Act update](https://fedil.lu/en/publications/ai-act-update-enforcement-begins-as-the-digital-omnibus-reshapes-the-timeline/) (search summary).

### L-41: Consumer mediation

Every French professional selling to consumers must offer free mediation (Code de la consommation L612-1) and inform consumers of it (L616-1); a secondary source says the professional must have contracted beforehand with a mediator listed by the CECMC, and that L641-1 fines a missing notice €3,000 for an individual and €15,000 for a company. Must the owner contract with a listed mediator before the first sale and display it? If a merchant of record is the consumer's counterparty, does the duty move to it? Which mediator covers a digital subscription? The EU ODR platform closed on 2025-07-20, and with it the duty to link to it.

- **Unblocks:** I-30 slice 0 (who is the seller of record) and slice 7 (the terms of sale and the footer).
- **Deadline:** before the first sale.
- **Raised in / sources:** the ninth pass's gap sweep. Service-Public Entreprendre, [Médiation des litiges de la consommation](https://entreprendre.service-public.gouv.fr/vosdroits/F33338) (search summary; page verified 2026-10-16); Lettre des réseaux, [mediator information duty](https://www.lettredesreseaux.com/?p=23453) (search summary); CMS, [The ODR platform is closing](https://cms.law/en/deu/legal-updates/the-odr-platform-is-closing-what-businesses-need-to-know) (search summary).

### L-42: Conformity guarantee, price rises and feature removals

(a) Which statements of the legal conformity guarantee for digital content and services (Directive 2019/770 as transposed) must the terms of sale carry? (b) How much notice does a price rise or a feature removal for existing subscribers need, and must subscribers be able to cancel free before it applies? This replaces a sub-question of L-03. (c) Which of these duties stay with the owner under a merchant of record? A pause of paid AI for every subscriber is asked separately, in [L-47](#l-47-operator-access-its-log-and-global-switches) (c).

- **Unblocks:** I-30 slices 7 and 8; the versioned terms of sale (`LegalDocument` slug `sale`, I-38 table 1.5) and the test that no price change takes effect before its notice date.
- **Raised in / sources:** the ninth pass's gap sweep. [Directive (EU) 2019/770](https://eur-lex.europa.eu/eli/dir/2019/770/oj) (not fetched this pass).

### L-43: Referral and creator rewards

(a) Is a free month for a converted referral, or a free early-access flag for a creator, a benefit in kind under loi n° 2023-451 on commercial influence, so that posts carrying the link must be labelled as advertising? (b) Must the product tell referrers so, and in which words? (c) May minors take part ([L-08](#l-08-minors-the-stated-minimum-age-and-adult-only-features))? (d) Does a referral credit fit the Fan Content Policy if [L-16](#l-16-does-a-paid-tier-fit-wizards-fan-content-policy) allows a paid tier? Added 2026-11-10 from I-72: (e) Is an ordinary player who posts a referral link to a small group "mobilising notoriety with an audience" under art. 1 of loi 2023-451, and is "I get a free month if you subscribe" a sufficient explicit mention under art. 5-2? (f) Must the referral's conditions be presented as a promotional offer, and where? (g) Does a complimentary seat that requires no post still make a creator's later mention a commercial communication, and does a disclosure on the creator page help? (h) Is a referral page reachable by a minor a "direct exhortation" under Annex I point 28 of the Unfair Commercial Practices Directive when it is hidden from accounts without the adult declaration?

- **Unblocks:** I-72 slices 11 and 12, the referral credit (moved 2026-11-10 from I-30, still after its slice 9), and slice 15, early access and a complimentary seat for creators ([D-80](owner-decisions.md#product-scope-and-non-goals)). The creator kit itself (I-72 slice 13, moved from I-36) needs no answer.
- **Raised in / sources:** the ninth pass's gap sweep; [I-72 open question 1](specs/i72-growth-loops-referrals-creators-and-return.md#open-questions); I-36's non-goals exclude revenue shares, tips and affiliate splits. Légifrance, [Loi n° 2023-451 du 9 juin 2023](https://www.legifrance.gouv.fr/loda/id/JORFTEXT000047663185), consolidated version in force on 2026-11-10 (art. 1 as amended by ordonnance 2024-978, art. 5-2); Directive 2005/29/EC, [Annex I](https://www.legislation.gov.uk/eudr/2005/29/annex/I/adopted), point 28 (read through a search summary, because EUR-Lex returned no content to the fetcher).

### L-44: The record of processing and a breach procedure

(a) Does the Art. 30(5) exemption for organisations under 250 people reach a solo operator whose processing is not occasional? (b) What must the breach procedure hold for Art. 33 (the CNIL within 72 hours) and Art. 34 (the people affected)? (c) Do the processors' breach clauses (Vercel, Supabase, Sentry, Anthropic, OpenAI) meet Art. 28(3)(f)?

- **Unblocks:** I-38 slice 16, the register and the breach procedure.
- **Raised in / sources:** the ninth pass's gap sweep. GDPR, [Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj), Arts. 28, 30, 33 and 34 (standard text, not fetched this pass).

### L-45: The product's name and the Fan Content notice

(a) Do the name "MagicAIBuilder" and a domain built on "Magic", a Wizards of the Coast trademark, fit trademark law and the Fan Content Policy before money is taken? (b) Must the footer carry the Fan Content Policy's notice verbatim? `LEGAL.md` and the footer text `notAffiliated` in all ten message catalogues cite "Wizards' Fan Site Policy" (checked on `origin/dev` at `72fbfc1`), while the Fan Content Policy gives its own notice: "MagicAIBuilder is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC." This entry places the name question that this brief first listed as not raised by any spec.

- **Unblocks:** I-38 slice 1's footer and `LEGAL.md` text; [D-77](owner-decisions.md#content-and-naming) on the name; I-30's billing; the answer to L-16 depends on it.
- **Deadline:** before the first payment, ad or affiliate link.
- **Raised in / sources:** the ninth pass's gap sweep; [I-30 open questions](specs/i30-business-model-and-paid-tier.md#open-questions) ("the footer notice, which still cites the 'Fan Site Policy'"). Wizards of the Coast, [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy) (last updated 2017-11-15, notice text read 2026-11-10).

### L-46: Selling outside the EU, and invoicing business buyers (accountant)

(a) If the owner sells through Stripe rather than a merchant of record, must he register for UK VAT from the first digital sale to a UK consumer? A secondary source says a seller with no UK establishment has no threshold; confirm on GOV.UK. (b) Which Swiss, Norwegian or US state thresholds apply? (c) For an I-41 store plan sold to French businesses, which e-invoicing and e-reporting dates bind a micro-entrepreneur? Pairs with [L-01](#l-01-legal-structure-vat-and-invoicing-accountant).

- **Unblocks:** the merchant-of-record or Stripe comparison in I-30 slice 0 ([D-11](owner-decisions.md#money-and-plans)); if Stripe is chosen, checkout refuses countries where no registration exists; I-41's store plan.
- **Raised in / sources:** the ninth pass's gap sweep. VATCalc, [UK VAT on foreign digital services](https://www.vatcalc.com/uk/uk-vat-on-foreign-digital-services/) (search summary, secondary).

### L-47: Operator access, its log and global switches

I-69 gives the operator roles, an append-only log of every view and action on an account, and switches that pause AI or an upstream for every player. (a) After the CJEU's _Pankki S_ judgment (C-579/21, 2023-06-22), must an access request include the dates and purposes of the operator's consultations of the account, and must I-38's export carry them? (b) How long may the operator log be kept, given the CNIL's six months to one year for access logs and up to three years where justified, and may it outlive the account in pseudonymised form? (c) When paid AI is paused for every subscriber (provider outage, security, the spend ceiling, an upstream's demand), is that a lack of conformity or an update under Code de la consommation L224-25-26, which requires a contract clause with "une raison valable", advance notice and no extra cost? What must the terms and the notice say, and is compensation owed?

- **Unblocks:** I-69 slices 10 and 14 and the wording of its requirement 10.3.
- **Raised in / sources:** [I-69 open question 2](specs/i69-operator-console-support-moderation-and-kill-switches.md#open-questions). CJEU, [press release 107/23](https://curia.europa.eu/jcms/upload/docs/application/pdf/2023-06/cp230107en.pdf); CNIL, [recommandation relative aux mesures de journalisation](https://www.cnil.fr/fr/la-cnil-publie-une-recommandation-relative-aux-mesures-de-journalisation) (2021-11-18); Légifrance, [L224-25-26](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000044133275).

### L-48: Erased accounts in encrypted exports

I-71 keeps 14 daily, 8 weekly and 12 monthly encrypted off-site exports of the database, so an erased account survives in them for up to 12 months, and every restore re-applies the deletions recorded after the export's time before the database serves players. Is that compatible with the right to erasure, and must the privacy policy state the exports' retention?

- **Unblocks:** I-71 slice 2's retention (requirement 4.5) and the export line of I-38 slice 6's privacy policy.
- **Raised in / sources:** [I-71 open question 4](specs/i71-speed-uptime-and-recovery.md#open-questions), requirements 4.5 and 4.12.

## M. Preview cards and set pages (added 2026-11-10)

The tenth research pass of 2026-11-10 added I-72 to I-75. L-49 and L-50 come from [I-73](specs/i73-every-set-release-ready-on-day-one.md#open-questions), its open question 3; I-72's questions are L-43 (e) to (h), and I-73's question on the digest and I-75's three questions are additions to L-14, L-16, L-37 and L-39. Research, not legal advice.

### L-49: Universes Beyond card images and preview cards under the Fan Content Policy

(a) May the product show Universes Beyond card images, which carry a partner's intellectual property such as Star Trek or Marvel, through Scryfall, on deck pages, in the radar and on set pages? The Fan Content Policy asks fans not to use other people's intellectual property without permission. (b) The policy says nothing about cards Wizards has officially previewed before release. Is showing them, as Scryfall does, within Wizards' terms? Pairs with [L-19](#l-19-the-card-back-card-art-and-artist-credit).

- **Unblocks:** the images on I-73 slice 10's set pages; preview printings in I-18's corpus and in I-73 slices 2 and 7, with [D-81](owner-decisions.md#product-scope-and-non-goals).
- **Raised in / sources:** [I-73 open question 3](specs/i73-every-set-release-ready-on-day-one.md#open-questions) (a) and (d). Wizards of the Coast, [Fan Content Policy](https://company.wizards.com/en/legal/fancontentpolicy) (last updated 2017-11-15, read 2026-11-10); Scryfall, [API documentation](https://scryfall.com/docs/api), "Use of Scryfall Data and Images" (read 2026-11-10).

### L-50: A public set page of commanders and counts against Scryfall's repackaging clause

Scryfall: "You may not simply repackage, republish, or proxy Scryfall data. Your software must create additional value." I-73's Commander-lens set page would list a set's new possible commanders with their colour identity and links, the existing commanders that gain a two-card combo with a new card, citing Commander Spellbook, and counts of new cards that share a typal commander's creature type, with no card grid, full card list or price list. Does that "simply repackage" Scryfall data, or add value? Pairs with [L-21](#l-21-proxying-repackaging-and-our-own-api-terms-scryfall).

- **Unblocks:** I-73 slice 10, with [D-82](owner-decisions.md#product-scope-and-non-goals).
- **Raised in / sources:** [I-73 open question 3](specs/i73-every-set-release-ready-on-day-one.md#open-questions) (b). Scryfall, [API documentation](https://scryfall.com/docs/api), "Use of Scryfall Data and Images" (read 2026-11-10).

## N. Bracket benchmarks and deck retention (added 2026-11-11)

The eleventh research pass of 2026-11-11 added I-76 to I-79. L-51 comes from [I-77](specs/i77-a-bracket-estimate-players-can-audit.md#open-questions), its open question 3 and requirement 8.7; L-52 comes from the deck trash the pass proposes for I-01 ([D-92](owner-decisions.md#community-and-moderation)). Its other questions are additions to L-21 (f), L-22 and L-24 (h). Research, not legal advice.

### L-51: Quoting other bracket calculators' accuracy

I-77's methods page would set our scorer's accuracy beside figures other products publish, such as ScrollVault's 77.1%, the 88.9% SpellRack attributes to it, or SpellRack's own 83.4%. Is that permitted comparative advertising under the Code de la consommation (articles L122-1 and following: objective, verifiable, comparing like with like)? Does quoting each figure with its date and link, without a "better than" claim, stay clear? Recommended until answered: quote others only by their own published figures, dated and linked, with no ranking.

- **Unblocks:** the comparison lines of I-77 slice 9 and [D-94](owner-decisions.md#content-and-naming).
- **Raised in / sources:** [I-77 open question 3](specs/i77-a-bracket-estimate-players-can-audit.md#open-questions). ScrollVault, [How the ScrollVault bracket calculator works](https://scrollvault.net/posts/how-scrollvault-bracket-calculator-works.html) (2026-04-07); SpellRack, [accuracy](https://spellrack.com/accuracy) ("Public benchmark · 2026-11-10").

### L-52: A deck trash and the right to erasure

If a deleted deck stays restorable for 30 days ([D-92](owner-decisions.md#community-and-moderation)), is that compatible with storage limitation (GDPR Art. 5(1)(e)), and must an Art. 17 request or an account deletion purge the trash at once? What must the privacy notice say? Pairs with [L-10](#l-10-retention-periods) and [L-48](#l-48-erased-accounts-in-encrypted-exports).

- **Unblocks:** I-01's trash item and D-92.
- **Raised in / sources:** the eleventh pass's deck-lifecycle gap (I-01, 2026-11-11). Moxfield restores deleted decks (`RESTORE_DELETED_DECK` in its production code, captured 2026-05-14); r/Moxfield asked to delete "literally hundreds of old decks" at once ([thread](https://www.reddit.com/r/Moxfield/comments/1wsnch7/), 2026-09-28). [GDPR](https://eur-lex.europa.eu/eli/reg/2016/679/oj), Art. 5(1)(e) and 17.

## Not placed, and gaps this brief noticed

- I-29's research lists "twelve" lawyer questions in uncommitted notes. The spec names four: the paid tier (L-16), database rights (L-24), opt-out signals (L-24) and a GDPR basis for handles (L-09). The other eight could not be recovered.
- Not raised by any spec: [I-13](specs/i13-visual-direction.md#open-questions) calls a fixed hero card art "legally safe" without saying why. L-19 may cover it.
