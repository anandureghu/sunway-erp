# SHRS Settings — Employee Master + Audit groups

**Date:** 2026-10-12  
**Status:** Implemented  
**Scope:** Frontend HR Settings / Reports navigation

## Goal

Regroup HR Settings into **Employee Master** and Audit-style groups; move Compliance (Immigration Expiry) from HR Reports into Employee Master.

## Structure (HR Settings)

| Top group | Contents |
|-----------|----------|
| **Employee Master** | Confirmations, Contract renewals, Appraisals, Leave types, Leave approvals, Loan approvals, Compliance |
| **Organizational** | Org Structure, Departments, Job Codes, Number Sequences |
| **Policies and access Administration** | HR Policies, Public Holidays, Social |
| **Permissions** | Permissions panel |
| **Roles** | Roles panel |

Page title remains **HR Settings**. Module sidebar title remains **SHRS and Payroll**.

## Compliance move

- Render `ImmigrationExpiryReport` under Employee Master (`?tab=employee-master&sub=immigration`).
- Remove Compliance group from HR Reports.
- Redirect `/hr/reports?tab=immigration|compliance` and `/hr/immigration-expiry` → settings URL.

## Permissions

Compliance tab visible with `HR_REPORTS`, `HRR_IMMIGRATION_EXPIRY`, `IMMIGRATION`, or HR Settings umbrella/admin. Settings page access extended for those grants.
