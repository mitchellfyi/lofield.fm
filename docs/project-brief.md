# LoField FM project brief

Reviewed 9 September 2026 from repository documentation and the owner's
portfolio working agreement. This is orientation, not a live health report.

## Purpose and audience

A browser music studio for creating lo-fi beats through natural-language controls and interactive audio tools.

People who want an approachable way to make and revisit music. Preserve browser audio behaviour, saved work, authentication and local development privacy.

## Work and verification

- Local setup: `npm ci`, then `npm run dev`; follow the README for local service configuration.
- Verification: `npm run ci` for quality and tests, and `npm run build`; CI also performs the dependency audit.
- CI: `ci.yml`: quality, unit-tests, security-audit, e2e-tests and build.
- Start each session with current open issues/PRs, main CI and relevant release
  evidence. Reuse existing work; the issue tracker owns task status.
- Service changes follow the project's documented Ops deployment and recovery
  procedures. Verify affected integrations and deployed revisions when releasing.

## Evidence, cost and next decision

No verified revenue, acquisition, retention or full recurring-cost baseline was
established for this brief. Use dated analytics, error/recovery evidence, bills
and owner observations; keep estimates and missing evidence explicit. Count
shared services once in the portfolio cost view. Prefer smaller maintenance
burdens over new infrastructure or speculative features.

Proposed next experiment, subject to the owner's decision:

Draft a short first-beat tutorial with one concrete musical outcome. Propose a two-hour walkthrough, no spend; measure time to first audible result and successful save/revisit before testing a paid feature or promotion.

Review this question in the next weekly Ops issue. The report itself authorizes
no execution. The owner records decisions there and later assigns an agent to
carry out approved work, linking project issues/PRs and verification back to Ops.

## Context and shared agreement

- [README.md](../README.md)
- [M12N working agreement](m12n-standards.md): public-safe local snapshot.

Source: Ops `docs/templates/project-agent-standard.md`, revision
`6ff420bbc82af3494606d4e42e736191f1526864`; reviewed 9 September 2026.
Source SHA-256: `d0b44b33a9d1c2b84626518dd9d4a2958ee89e201185bd723ef5572e2fea7d30`.
Local snapshot SHA-256 (after repository formatting): `d0b44b33a9d1c2b84626518dd9d4a2958ee89e201185bd723ef5572e2fea7d30`.
Project-specific instructions remain in `AGENTS.md` and the linked documents.
Update snapshots through reviewed commits; do not load moving remote instructions
at session startup. Revisit this brief when direction, commands or evidence change.
