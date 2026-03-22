import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/context/AuthContext";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { toggleAdminView } from "@/store/uiSlice";
import { displayRole } from "@/types/role";
import { Building2, ChevronDown, LogOut, Shield, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

function initialsFromName(name: string | undefined): string {
  if (!name?.trim()) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const Navbar = () => {
  const { logout, user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const adminView = useAppSelector((s) => s.ui.adminView);

  const initials = initialsFromName(user?.username);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/50 bg-background/80 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 sm:gap-4 sm:px-5">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <SidebarTrigger className="-ml-1 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground" />
        <Separator orientation="vertical" className="hidden h-6 sm:block" />
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/60 ring-1 ring-border/60">
            <img
              src="/assets/logo-dark.svg"
              alt=""
              width={22}
              height={22}
              className="dark:invert"
            />
          </div>
          <span className="truncate font-display text-sm font-semibold tracking-tight">
            Sunway
          </span>
        </div>
      </div>

      <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
        {user?.role === "SUPER_ADMIN" ? (
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-3 py-1 sm:flex">
              <Shield className="h-3.5 w-3.5 text-primary" aria-hidden />
              <Label
                htmlFor="admin-view-toggle"
                className="cursor-pointer text-xs font-medium text-muted-foreground"
              >
                Admin view
              </Label>
              <Switch
                id="admin-view-toggle"
                checked={adminView}
                onCheckedChange={() => dispatch(toggleAdminView())}
              />
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <Label htmlFor="admin-view-toggle-mobile" className="sr-only">
                Admin view
              </Label>
              <Switch
                id="admin-view-toggle-mobile"
                checked={adminView}
                onCheckedChange={() => dispatch(toggleAdminView())}
              />
            </div>
          </div>
        ) : (
          <div className="hidden max-w-[min(100%,200px)] min-w-0 items-center gap-2 md:flex">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <p className="truncate text-xs font-medium text-muted-foreground">
              {user?.companyName ?? "Your company"}
            </p>
          </div>
        )}

        <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-11 max-w-[min(100%,280px)] gap-2 rounded-xl px-2 hover:bg-muted/80"
          >
            <div className="hidden min-w-0 flex-1 text-right sm:block">
              <p className="truncate text-sm font-semibold leading-none">
                {user?.username ?? "User"}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {displayRole((user as { companyRole?: string })?.companyRole, user?.role)}
              </p>
            </div>
            <Avatar className="h-9 w-9 border border-border/60 shadow-sm ring-2 ring-background">
              <AvatarImage src={undefined} alt="" />
              <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 rounded-xl" align="end" sideOffset={8}>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.username}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || "No email on profile"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer rounded-lg gap-2"
            onClick={() => navigate("/profile")}
          >
            <User className="h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer rounded-lg gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
            onClick={logout}
          >
            <LogOut className="h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
