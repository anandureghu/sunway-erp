# CRM Enquiries (company-scoped)

**Date:** 2026-10-13  
**Status:** Approved for implementation  
**Scope:** Backend + frontend (separate from Super Admin platform enquiries)

## Goal

Let each company track sales and purchase prospects in CRM: contact details, pipeline status, relationship stage, multiple notes, and convert won enquiries into Customer or Supplier records.

## Placement

- CRM landing card **Enquiries** → `/inventory/crm/enquiries`
- Detail → `/inventory/crm/enquiries/:id`
- Permission: Sales and/or Purchase view (same CRM gate); no new permission id in v1

## Data model

`CrmEnquiry` (company-scoped):

| Field | Notes |
|-------|--------|
| name, organizationName | Required name |
| prospectType | `CUSTOMER` / `SUPPLIER` / `BOTH` |
| email, phone, secondaryContact, address | Contact |
| source, interest, summary | Optional context |
| pipelineStatus | `NEW` / `IN_PROGRESS` / `WON` / `LOST` / `ON_HOLD` |
| relationshipStage | `PROSPECTIVE` / `CURRENT` / `PAST` |
| customerId, vendorId | Set on convert |
| notes | Child rows: body, createdBy, createdAt |

## UI

1. List — search + filters (pipeline, stage, type)
2. Detail — edit fields, notes thread, Convert to Customer / Supplier
3. CRM hub — third card beside Customers / Suppliers

## Out of scope (v1)

Public web form, email ingest, file attachments, tasks/reminders, new permission module.
