# ChatGPT project context — Westcon Presentation Studio

Repository target: ivanderodrigo/presentaciones

## Purpose
Create ad-hoc, partner-facing Westcon Comstor presentations from the FY27 corporate deck, vertical datasheets and verified public market intelligence.

## Product principle
Maximum intelligence underneath, minimum effort for the user.

## Product direction
- This is a presentation builder, not a meeting manager.
- The user can start from a proposed deck or from an empty deck.
- The builder exposes the original FY27 corporate slide library so slides can be added, removed, previewed and reordered.
- Role and vertical are optional helpers. The interface must explain exactly what each selector changes.
- Prefer original slides. Generate new slides only when they add depth the source deck does not already contain.
- Generated vendor slides must pass content-density gates.
- Do not add market/analyst slides automatically unless there is enough attributable evidence.
- Internal reasoning, scoring, whitespace, research queues and seller instructions must never appear in the partner-facing PPT.
- Generated PowerPoint slides should be editable and visually consistent with Westcon.

## Core data
- data/slide-index.* — semantic index of 84 corporate + 12 vertical source slides.
- data/vertical-content.* — structured 4 verticals × 3 areas.
- data/vendor-intelligence.* — structured intelligence for 36 vendors.
- data/live-intelligence.* — refreshed public evidence.
- data/partner-intelligence.* — public partner dossiers.
- assets/source-slides/corporate/ — FY27 source slide renders.
- assets/source-slides/verticals/ — vertical source renders.

## GitHub / ChatGPT
Direct read/write access from ChatGPT to this repository is enabled. For substantial changes use a dedicated branch, validate through the Pull Request workflow, review the diff and merge to main. Preserve automatically refreshed intelligence files unless the task explicitly requires changing them.
