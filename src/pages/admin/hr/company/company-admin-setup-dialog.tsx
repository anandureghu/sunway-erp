import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, Users } from "lucide-react";
import type { Company } from "@/types/company";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company;
  onCreateNew: () => void;
  onAssignExisting: () => void;
};

export function CompanyAdminSetupDialog({
  open,
  onOpenChange,
  company,
  onCreateNew,
  onAssignExisting,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set up company admin</DialogTitle>
          <DialogDescription>
            How would you like to add an administrator for {company.companyName}?
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 pt-2">
          <Button
            variant="outline"
            className="h-auto justify-start gap-3 px-4 py-4"
            onClick={() => {
              onOpenChange(false);
              onCreateNew();
            }}
          >
            <UserPlus className="h-5 w-5 shrink-0 text-primary" />
            <div className="text-left">
              <p className="font-medium">Create new user</p>
              <p className="text-xs font-normal text-muted-foreground">
                Add a new employee account with login credentials
              </p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="h-auto justify-start gap-3 px-4 py-4"
            onClick={() => {
              onOpenChange(false);
              onAssignExisting();
            }}
          >
            <Users className="h-5 w-5 shrink-0 text-primary" />
            <div className="text-left">
              <p className="font-medium">Assign existing user</p>
              <p className="text-xs font-normal text-muted-foreground">
                Link an existing account so they can switch to this company
              </p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
