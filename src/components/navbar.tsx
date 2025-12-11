// src/components/Navbar.tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { toggleAdminView } from "@/store/uiSlice";
import { useAppDispatch, useAppSelector } from "@/store/store";

const Navbar = () => {
  const { logout, user } = useAuth();
  const dispatch = useAppDispatch();
  const adminView = useAppSelector((s) => s.ui.adminView);
  console.log(user);
  return (
    <div className="w-full bg-primary text-white border-b-1 border-b-foreground/10 border-l-1 border-l-blue-500/0 h-[70px] flex items-center justify-end px-4 fixed top-0 z-10 max-w-[calc(100vw-16rem)] pr-10">
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
      <div className="flex items-center gap-3">
        <div className="text-end">
          <h1 className="m-0 p-0">
            Hi,{" "}
            <span className="font-semibold">{user?.username ?? "User"}</span>
          </h1>
          <p className="text-sm">
            {/* optionally user email or role */}
            {user?.role ?? ""}
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

        <Separator orientation="vertical" className="h-full w-1" />

        <Button variant="ghost" onClick={logout}>
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
