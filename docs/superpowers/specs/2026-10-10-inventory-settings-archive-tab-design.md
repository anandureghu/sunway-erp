# Inventory Settings — Archive tab

**Date:** 2026-10-10  
**Status:** Approved for planning  
**Scope:** Frontend only

## Problem

Archived inventory history (`HistoryTabPanel` for `module="inventory"`) currently lives on **Operations Reports**. That mixes operational reporting with destructive archive management, and it is not gated the same way as other inventory configuration surfaces.

## Goal

Move archive management into **Inventory Settings** as a clearly named tab, gated by existing item/stock permissions, and remove it from Operations Reports.

## Decisions

| Topic | Choice |
|-------|--------|
| Tab label | **Archive** |
| Placement | Top-level Inventory Settings tab (`?tab=archive`) |
| Permission | Show if `INVENTORY_ITEM` **or** `INVENTORY_STOCK` (admins unchanged via existing settings `allow` rule) |
| Operations Reports | Remove Archived records section entirely |
| New permission module | No |

## Design

### Placement

Add a new group on `InventorySettingsPage`:

- `value`: `archive`
- `label`: `Archive`
- Single panel (no nested sub-tabs)
- Content: render `HistoryTabPanel` with `module="inventory"` directly (no extra outer Card). The panel already provides the “Archived history” card, filters, and actions.

### Permissions

Reuse existing helpers on the settings page:

```ts
allow(InventoryModule.ITEM) || allow(InventoryModule.STOCK)
```

No new rows in `permission-catalog.ts`. Users who can manage items or view stock can open Archive; delete-all / bulk-delete behavior stays inside `HistoryTabPanel` as today.

### Removal from Operations Reports

In `OperationsReportTab`, delete the Card that wraps `<HistoryTabPanel module="inventory" />` and unused imports.

### Routing / deep links

- Canonical: `/inventory/settings?tab=archive`
- Add `archive` to any legacy tab map only if needed (new id; no legacy alias required)

### Out of scope

- Backend history APIs
- New permission ids
- Finance/HR history panels
- Renaming entity-type labels inside `HistoryTabPanel`

## Files (expected)

| File | Change |
|------|--------|
| `frontend/src/pages/inventory/inventory-settings-page.tsx` | Add Archive group + permission gate |
| `frontend/src/modules/inventory/reports/OperationsReportTab.tsx` | Remove archived records card |
| Optional thin wrapper under `frontend/src/modules/inventory/settings/` | Only if settings page needs a dedicated element component |

## Success criteria

1. Archive tab appears in Inventory Settings only when the user has Items or Stock (or is admin).
2. Operations Reports no longer shows archived history.
3. Archive UI behavior matches today’s history panel (filters, search, delete, pagination).
