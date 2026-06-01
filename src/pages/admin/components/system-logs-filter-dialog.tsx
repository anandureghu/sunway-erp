import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SYSTEM_LOG_MODULES = [
  "All",
  "Finance",
  "Purchase",
  "Sales",
  "Inventory",
  "HR",
  "Auth",
  "Admin",
  "Master data",
  "System",
] as const;

export type SystemLogFilters = {
  level: string;
  module: string;
  fromDate: string;
  toDate: string;
  userIdFilter: string;
};

export const DEFAULT_SYSTEM_LOG_FILTERS: SystemLogFilters = {
  level: "all",
  module: "All",
  fromDate: "",
  toDate: "",
  userIdFilter: "",
};

type SystemLogsFilterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applied: SystemLogFilters;
  onApply: (filters: SystemLogFilters) => void;
};

export function countActiveSystemLogFilters(filters: SystemLogFilters): number {
  let count = 0;
  if (filters.level !== "all") count++;
  if (filters.module !== "All") count++;
  if (filters.fromDate) count++;
  if (filters.toDate) count++;
  if (filters.userIdFilter.trim() && /^\d+$/.test(filters.userIdFilter.trim())) {
    count++;
  }
  return count;
}

export function SystemLogsFilterDialog({
  open,
  onOpenChange,
  applied,
  onApply,
}: SystemLogsFilterDialogProps) {
  const [draft, setDraft] = useState<SystemLogFilters>(applied);

  useEffect(() => {
    if (open) {
      setDraft(applied);
    }
  }, [open, applied]);

  const handleClear = () => {
    setDraft(DEFAULT_SYSTEM_LOG_FILTERS);
  };

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter logs</DialogTitle>
          <DialogDescription>
            Narrow results by level, module, user, or date range.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Level</Label>
            <Select
              value={draft.level}
              onValueChange={(v) => setDraft((d) => ({ ...d, level: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="WARN">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Module</Label>
            <Select
              value={draft.module}
              onValueChange={(v) => setDraft((d) => ({ ...d, module: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All modules" />
              </SelectTrigger>
              <SelectContent>
                {SYSTEM_LOG_MODULES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-user-id">User ID</Label>
            <Input
              id="filter-user-id"
              placeholder="e.g. 42"
              inputMode="numeric"
              value={draft.userIdFilter}
              onChange={(e) =>
                setDraft((d) => ({ ...d, userIdFilter: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Date range</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">From</span>
                <Input
                  type="date"
                  value={draft.fromDate}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, fromDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">To</span>
                <Input
                  type="date"
                  value={draft.toDate}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, toDate: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleClear}>
            Clear all
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleApply}>
              Apply filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
