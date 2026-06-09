import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { Search, User } from "lucide-react";
import type { UserSearchResult } from "@/types/auth-company";
import type { Company } from "@/types/company";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  onSuccess: () => void;
};

export function AssignExistingUserDialog({
  open,
  onOpenChange,
  company,
  onSuccess,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selected, setSelected] = useState<UserSearchResult | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setSelected(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<UserSearchResult[]>("/users/search", {
          params: { q: query.trim() },
        });
        setResults(res.data);
      } catch {
        toast.error("Failed to search users");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open]);

  const handleAssign = async () => {
    if (!selected) return;
    setAssigning(true);
    try {
      await apiClient.post(`/companies/${company.id}/assign-user`, {
        userId: selected.userId,
      });
      toast.success(
        `${selected.fullName} can now switch to ${company.companyName} after login.`,
      );
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to assign user";
      toast.error(message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign existing user</DialogTitle>
          <DialogDescription>
            Link an existing account as a member of {company.companyName}. They
            can switch to this company after login.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or username..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {loading && (
            <p className="text-sm text-muted-foreground">Searching...</p>
          )}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <p className="text-sm text-muted-foreground">No users found.</p>
          )}
          {results.map((u) => (
            <button
              key={u.userId}
              type="button"
              onClick={() => setSelected(u)}
              className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition hover:bg-muted/50 ${
                selected?.userId === u.userId
                  ? "border-primary bg-primary/5"
                  : "border-border"
              }`}
            >
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{u.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  {u.email} · @{u.username}
                </p>
                {u.companyNames.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Companies: {u.companyNames.join(", ")}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selected || assigning}
          >
            {assigning ? "Assigning..." : "Assign to company"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
