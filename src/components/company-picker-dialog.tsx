import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2 } from "lucide-react";
import type { CompanySummary } from "@/types/auth-company";

type Props = {
  open: boolean;
  companies: CompanySummary[];
  onSelect: (companyId: number) => void;
};

export function CompanyPickerDialog({ open, companies, onSelect }: Props) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Select company</DialogTitle>
          <DialogDescription>
            Your account belongs to multiple companies. Choose which one to open.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          {companies.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition hover:bg-muted/50"
            >
              {c.logoUrl ? (
                <img
                  src={c.logoUrl}
                  alt=""
                  className="h-8 w-8 rounded border object-contain"
                />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
              <span className="font-medium">{c.companyName}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
