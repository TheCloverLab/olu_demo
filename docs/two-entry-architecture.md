# OLU Two-Entry Architecture

This demo now uses one codebase with two URL entry points:

- Consumer app: `/`
- Business workspace: `/business`

## Why

The product direction after the "产品架构图" section is no longer role-first. We still keep the existing role data model for compatibility, but the business-facing experience now starts from a module-first workspace.

## Surface split

### Consumer app

Primary purpose: audience-facing product surface.

Current routes:
- `/`
- `/chat`
- `/shop`
- `/profile`
- `/settings`
- `/creator/:id`
- `/content/:id`

### Business workspace

Primary purpose: merchant operations, AI employees, and modular business workflows.

Current routes:
- `/business`
- `/business/team`
- `/business/agents`
- `/business/profile`
- `/business/settings`
- `/business/wallet`
- `/business/modules/creator`
- `/business/modules/marketing`
- `/business/modules/supply`

## Compatibility mapping

Old role-driven routes still redirect into the new business workspace:

- `/team` -> `/business/team`
- `/ai-config` -> `/business/agents`
- `/wallet` -> `/business/wallet`
- `/console/creator` -> `/business/modules/creator`
- `/console/advertiser` -> `/business/modules/marketing`
- `/console/supplier` -> `/business/modules/supply`

## Next implementation priority

1. Keep consumer routes stable for content/community demo.
2. Move all merchant-facing work into `/business`.
3. Replace role-first business copy with module-first copy.
4. Build the flagship influencer marketing journey inside `/business/modules/marketing`.
