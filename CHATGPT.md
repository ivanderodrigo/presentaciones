# ChatGPT project context — Westcon Presentation Builder

Repository target: `ivanderodrigo/presentaciones`

## Purpose
Create ad-hoc, partner-facing Westcon Comstor presentations from the FY27 corporate deck, vertical datasheets and verified public market intelligence.

## Product principle
Maximum intelligence underneath, minimum effort for the user.

## Product direction
- This is a **presentation builder**, not a meeting manager.
- The user can start from a proposed deck or from an empty deck.
- The builder exposes the original FY27 corporate slide library so slides can be added, removed and reordered.
- It can generate new partner-facing slides for vertical use cases, vendor differentiation, analyst/market evidence, partner context and next steps.
- PSM, VSM and Solution Architect are lightweight context selectors, not separate management workflows.
- Internal reasoning, scoring, whitespace, research queues and seller instructions must never appear in the partner-facing PPT.

## Core data
- `data/slide-index.*` — semantic index of 84 corporate + 12 vertical source slides.
- `data/vertical-content.*` — structured 4 verticals × 3 areas.
- `data/vendor-intelligence.*` — structured intelligence for 36 vendors.
- `data/live-intelligence.*` — refreshed evidence from public sources.
- `data/partner-intelligence.*` — public partner dossiers.
- `assets/source-slides/corporate/` — FY27 source slide renders.
- `assets/source-slides/verticals/` — vertical source renders.

## Editing rule
Prefer original slides. Generate a new slide only when it adds context or synthesis that the source deck does not already contain.

## GitHub / ChatGPT
Direct read/write access from ChatGPT to this repository is enabled. For substantial changes, prefer: create a dedicated branch → validate → review diff → merge to `main`. Preserve automatically refreshed intelligence files unless the task explicitly requires changing them.
