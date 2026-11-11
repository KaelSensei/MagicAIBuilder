# I-XX: Short title

**Status:** Next
**Priority:** Next
**Depth:** Full or Light

One feature, one file. The roadmap row links here. Do not copy this file back into the roadmap.

## Summary and problem

Who is blocked, and by what. Cite a source with the date it was read. Do not invent a count.

## Goals

- The player-visible outcome.

## Non-goals

- What this feature will not do, including any roadmap non-goal it must not reverse.

## Personas

Which of the five roadmap personas this serves.

## User stories

#### US-XX-01

As a …, I want …, so that ….

## Acceptance criteria

#### AC-XX-01 Happy path

Given …
When …
Then …

#### AC-XX-02 Error and failure

Given the action cannot finish
When the player retries
Then the last confirmed state is unchanged and the message is a catalogue string

#### AC-XX-03 Guest and signed-in

Given the rollout
When a guest and a signed-in player open the surface
Then each sees only what the rollout allows

#### AC-XX-04 Locales

Given the ten catalogs `en`, `fr`, `de`, `it`, `es`, `ja`, `zh`, `ko`, `ru` and `pt`
When a string is added
Then only `en` and `fr` are routed, and the other eight keep key parity and may reuse English until a person reviews them

#### AC-XX-05 Accessibility

Given a keyboard and a screen reader
When the primary action is completed without a pointer
Then the control has a name, focus is visible, and status is not colour alone

## UX flow and states

Empty, loading, and error.

## Data model and API

Tables, routes, and what stays private.

## Analytics and telemetry

Event name and fields. Counts and enums only. No email, name, deck name, card name, list or URL. Not emitted before I-39's store exists.

## Rollout and feature flags

Guest, signed-in, and the I-69 switch if there is one.

## Dependencies

Links to other files in this folder, and the hard wait from the roadmap table.

## Risks and mitigations

## Kill criteria

Required for a Now initiative. Otherwise "None".

## Open questions

## Sources

Dated URLs.
