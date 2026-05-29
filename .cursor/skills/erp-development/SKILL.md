---
name: erp-development
description: >-
  Builds and fixes Sunway ERP React UI across HR, inventory, purchase, sales,
  finance, and admin. Use when editing pages, services, types, forms, tables, or
  apiClient calls under src/.
---

# Sunway frontend development

## Maintain docs

Before closing a task: if you used a pattern **not** already in `.cursor/rules/` or this skill, append it per `.cursor/rules/capture-knowledge.mdc` (usually under **Captured patterns** below or `project.mdc`).

## Locate code

1. **Route** — `src/App.tsx` or page under `src/pages/<area>/`
2. **API** — matching `src/service/*Service.ts`
3. **Types** — `src/types/` or `src/service/erpApiTypes.ts`

## Typical change

**List screen** — page + `src/lib/columns/*-columns.tsx` + service `list*` method.

**Form / create-edit** — page or `components/*-form.tsx`; validate client-side; POST/PUT via service; on failure:

```typescript
import { getApiErrorMessage } from "@/lib/api-error-message";

catch (e: unknown) {
  const msg = getApiErrorMessage(e, "Save failed.");
  setFormError(msg);
  toast.error(msg);
}
```

**Detail actions** — load entity in `useEffect`; action buttons call service; refresh after success.

## Module entry points

| Area | Service examples | Pages |
|------|------------------|-------|
| HR | `hr.service.ts` | `employees-page`, `modules/hr/` |
| Inventory | `inventoryService.ts` | `pages/inventory/` |
| Purchase | `purchaseFlowService.ts` | `pages/purchase/` |
| Sales | `salesFlowService.ts`, `invoiceService.ts` | `pages/sales/` |
| Finance | finance pages + dedicated services | `pages/finance/` |
| Admin | vendor/customer services | `pages/admin/` |

## Avoid

- New abstractions for one-off use
- Committing without user request
- Hardcoding API base URL (use `apiClient`)

## Verify

```bash
npm run build
```

## Captured patterns

<!-- Agents: prepend new bullets here (newest first). Do not duplicate project.mdc. -->

- **Purchase orders (draft edit)** — Edit from list when `status === "draft"`; `purchase-order-form` sends `supplierId` on update; use `CurrencyAmount` for money; supplier `Select` stays enabled in edit mode.
- **PO → AP** — Pay vendors only after **Release to supplier** (`confirmed`). `vendorPaymentSettled === true` means AP payment confirmed; cancel PO only while draft and unpaid. AP: Vendor payments + Purchase invoices tabs.
- **PO receipts** — After AP payment confirm: download **invoice receipt** (`getInvoicePdfUrl`) and **payment receipt** (`GET /finance/payments/{id}/pdf`) from PO detail; purchase invoice detail has Invoice/Receipt tabs for GENERATED docs.
- **PR line items** — Use `ItemSearchCombobox` + `filterItemsByQuery` from `@/lib/filter-items` (search by name/SKU/barcode); active items only.
- **Purchase invoice actions** — `createPurchaseInvoiceColumns(..., { onViewDetails, onOpenDocument })`; wire navigate + `getInvoicePdfUrl` / `invoiceDocumentPreviewUrl`. Line names: `purchaseLineItemName` + API `itemName`. Hide PO **Edit draft** when `vendorPaymentSettled`.
