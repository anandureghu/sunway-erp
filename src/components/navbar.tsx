// src/components/Navbar.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { toggleAdminView } from "@/store/uiSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { displayRole } from "@/types/role";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { logout, user } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const adminView = useAppSelector((s) => s.ui.adminView);
  return (
    <div className="w-full bg-white text-black border-b-1 border-b-foreground/10 border-l-1 border-l-blue-500/0 h-[70px] flex items-center justify-end px-4 fixed top-0 z-10 max-w-[calc(100vw-16rem)] pr-10">
      {user?.role === "SUPER_ADMIN" ? (
        <div className="flex items-center space-x-2 mr-5">
          <Label htmlFor="airplane-mode">Admin View</Label>
          <Switch
            id="airplane-mode"
            checked={adminView}
            onCheckedChange={() => dispatch(toggleAdminView())}
          />
        </div>
      ) : (
        <div className="mr-4">
          <h4 className="text-xs">Welcome to</h4>
          <h2 className="font-semibold">{user?.companyName}</h2>
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 p-2 -m-2 rounded-lg">
            <div className="text-end">
              <h1 className="m-0 p-0">
                Hi,{" "}
                <span className="font-semibold">
                  {user?.username ?? "User"}
                </span>
              </h1>
              <p className="text-sm">
                {displayRole((user as any)?.companyRole, user?.role)}
              </p>
            </div>

            <Avatar>
              <AvatarImage
                src="https://github.com/shadcn.png"
                width={60}
                height={60}
              />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.username}
              </p>
              <p className="text-xs leading-none text-slate-400">
                {user?.email || "no-email@example.com"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={logout}
            className="focus:bg-destructive focus:text-destructive-foreground"
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default Navbar;
