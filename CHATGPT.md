# ChatGPT project context — Westcon Presentation Builder v5.1

Repository: ivanderodrigo/presentaciones

## Product rule
The application must remain **clean, simple and hyper-intuitive**. Its job is to construct ad-hoc presentations, not manage meetings.

## Core interaction
Search/filter slides → add individual slides or thematic blocks → reorder visually → generate PowerPoint.

## Do not reintroduce
- role selectors (PSM/VSM/SA);
- generic AI-generated vendor/market slides;
- meeting-management flows;
- internal scoring, whitespace, research queues or seller instructions in partner-facing output.

## Content strategy
1. Prefer original FY27 slides.
2. Add curated vendor slides only when they are intentionally designed in the same visual language.
3. Generate vertical slides from structured vertical data using the FY27 sector-playbook aesthetic.
4. Keep research as an invisible knowledge layer.

## Current portfolio rules
- Juniper Networks is not an active Westcon portfolio vendor in this app.
- Cloudflare and Sonar (SonarQube) are active curated additions.
- The active vendor list contains 37 vendors.

## Vertical strategy
Nine sectors, each with Cybersecurity, Networking and Cloud/UC/Automation models:
Banca y seguros; Administración pública; Industria y utilities; Retail; Sanidad; Educación; Transporte y logística; Hostelería y turismo; Software y servicios digitales.

## GitHub workflow
For substantial changes: create branch → validate → PR → merge to main. Preserve original assets and scheduled research workflows.
\n## v5.1 rules\n- Cloudflare and Sonar slides must use their real logos.\n- Solution blocks add section + taxonomy + all active vendor slides in that area.\n- Three-slide vertical model per sector/area: context, use cases + vendors, activation.\n- Keep favicon/app identification enabled.\n