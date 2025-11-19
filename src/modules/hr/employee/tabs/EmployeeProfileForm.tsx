// modules/hr/employee/tabs/EmployeeProfileForm.tsx
import { useOutletContext, useParams } from "react-router-dom";
import React, { useState, useCallback, useEffect, type ReactElement } from "react";
import { useEmployeeSelection } from "@/context/employee-selection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileCtx } from "./ProfileShell";

type ProfileEvent = "profile:save" | "profile:cancel" | "profile:edit";

type EmpProfile = {
  employeeNo: string;
  firstName: string;
  lastName: string;
  department: string;
  designation: string;
  joinDate: string;      // yyyy-mm-dd
  dateOfBirth: string;   // yyyy-mm-dd
  gender: "Male" | "Female" | "Other" | "";
  status?: string;
};

const SEED: EmpProfile = {
  employeeNo: "1001",
  firstName: "Aisha",
  lastName: "Rahman",
  department: "IT",
  designation: "Engineer",
  joinDate: "2024-01-15",
  dateOfBirth: "1998-09-05",
  gender: "",
};

export default function EmployeeProfileForm(): ReactElement {
  const { editing } = useOutletContext<ProfileCtx>();
  const { id } = useParams<{ id: string }>();
  const { setSelected } = useEmployeeSelection();

  const loadInitial = useCallback((): EmpProfile => {
    const stored = localStorage.getItem("employees");
    if (stored) {
      try {
        const list = JSON.parse(stored);
        const found = list.find(( (e: any) => e.id === id));
        if (found) return found as EmpProfile;
      } catch (e) {
        /* ignore */
      }
    }
    return SEED;
  }, [id]);

  const [saved, setSaved] = useState<EmpProfile>(loadInitial);
  const [draft, setDraft] = useState<EmpProfile>(loadInitial);

  // Event handlers with proper types
  const handleSave = useCallback(() => setSaved(draft), [draft]);
  const handleCancel = useCallback(() => setDraft(saved), [saved]);
  const handleEdit = useCallback(() => setDraft(saved), [saved]);

  // Improved event listeners with proper cleanup
  useEffect(() => {
    const eventHandlers: Record<ProfileEvent, () => void> = {
      "profile:save": handleSave,
      "profile:cancel": handleCancel,
      "profile:edit": handleEdit,
    };

    // Add event listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      document.addEventListener(event, handler);
    });

    // Cleanup event listeners
    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        document.removeEventListener(event, handler);
      });
    };
  }, [handleSave, handleCancel, handleEdit]);

  const set = useCallback(<K extends keyof EmpProfile>(k: K, v: EmpProfile[K]) => 
    setDraft(d => ({ ...d, [k]: v })), []);

  // persist updated employee in localStorage and update selection context
  const persistChanges = useCallback((updated: EmpProfile) => {
    try {
      const stored = localStorage.getItem("employees");
      const list = stored ? JSON.parse(stored) : null;
      if (!list || !Array.isArray(list)) {
        // fallback: don't overwrite if missing
        return;
      }
      const idx = list.findIndex((e: any) => e.id === id);
      if (idx >= 0) list[idx] = { ...list[idx], ...updated };
      else list.push({ id, ...updated });
      localStorage.setItem("employees", JSON.stringify(list));
    } catch (e) {
      // ignore storage errors
    }

    // update selected employee in context
    setSelected({
      id: id ?? "",
      no: updated.employeeNo,
      name: `${updated.firstName} ${updated.lastName}`,
      firstName: updated.firstName,
      lastName: updated.lastName,
      status: updated.status ?? "Active",
      department: updated.department,
      designation: updated.designation,
      dateOfBirth: updated.dateOfBirth,
      gender: updated.gender,
      joinDate: updated.joinDate,
    });

    // notify other parts of the app to reload employees (e.g., overview stats)
    try {
      document.dispatchEvent(new Event("employees:updated"));
    } catch (e) {
      /* ignore */
    }
  }, [id, setSelected]);

  // when a save event is fired, persist the draft
  useEffect(() => {
    const onSave = () => {
      setSaved(draft);
      persistChanges(draft);
    };
    document.addEventListener("profile:save", onSave);
    return () => document.removeEventListener("profile:save", onSave);
  }, [draft, persistChanges]);

  return (
    <div className="space-y-6" role="form">
      <Row>
        <Field label="Employee No">
          <Input
            type="text"
            disabled={!editing}
            value={draft.employeeNo}
            onChange={(e) => set("employeeNo", e.target.value)}
            aria-label="Employee number"
            aria-required="true"
          />
        </Field>
        <Field label="First Name">
          <Input
            type="text"
            disabled={!editing}
            value={draft.firstName}
            onChange={(e) => set("firstName", e.target.value)}
            aria-label="First name"
            aria-required="true"
          />
        </Field>
      </Row>

      <Row>
        <Field label="Last Name">
          <Input
            type="text"
            disabled={!editing}
            value={draft.lastName}
            onChange={(e) => set("lastName", e.target.value)}
            aria-label="Last name"
            aria-required="true"
          />
        </Field>
        <Field label="Department">
          <Input
            type="text"
            disabled={!editing}
            value={draft.department}
            onChange={(e) => set("department", e.target.value)}
            aria-label="Department"
            aria-required="true"
          />
        </Field>
      </Row>

      <Row>
        <Field label="Designation">
          <Input
            type="text"
            disabled={!editing}
            value={draft.designation}
            onChange={(e) => set("designation", e.target.value)}
            aria-label="Designation"
            aria-required="true"
          />
        </Field>
        <Field label="Gender">
          <select
            disabled={!editing}
            className="h-9 w-full rounded-md border px-3 text-sm disabled:bg-muted/40"
            value={draft.gender}
            onChange={(e) => set("gender", e.target.value as EmpProfile["gender"])}
            aria-label="Gender"
          >
            <option value="" hidden>Select…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Field>
      </Row>

      <Row>
        <Field label="Join Date">
          <Input
            type="date"
            disabled={!editing}
            value={draft.joinDate}
            onChange={(e) => set("joinDate", e.target.value)}
            aria-label="Join date"
            aria-required="true"
          />
        </Field>
        <Field label="Date of Birth">
          <Input
            type="date"
            disabled={!editing}
            value={draft.dateOfBirth}
            onChange={(e) => set("dateOfBirth", e.target.value)}
            aria-label="Date of birth"
            aria-required="true"
          />
        </Field>
      </Row>

      <Row>
        <Field label="Status">
          <select
            disabled={!editing}
            className="h-9 w-full rounded-md border px-3 text-sm disabled:bg-muted/40"
            value={draft.status ?? "Active"}
            onChange={(e) => set("status", e.target.value as EmpProfile["status"]) }
            aria-label="Status"
          >
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Inactive">Inactive</option>
          </select>
        </Field>
        <div />
      </Row>
    </div>
  );
}

/* Layout helper components with proper types */
interface RowProps {
  children: React.ReactNode;
}

function Row({ children }: RowProps): ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {children}
    </div>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps): ReactElement {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className="space-y-1.5" role="group">
      <Label className="text-sm" htmlFor={fieldId}>
        {label}
      </Label>
      <div id={fieldId}>
        {children}
      </div>
    </div>
  );
}
