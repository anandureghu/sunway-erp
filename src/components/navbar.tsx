// ✅ Shadcn UI components live in src/components/ui
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";

const Navbar = () => {
  const { logout } = useAuth();

  return (
    <div className="w-full bg-background border-b-1 border-b-foreground/10 h-14 flex items-center justify-end px-4 fixed top-0 z-10 max-w-[calc(100vw-16rem)]">
      <div className="flex items-center gap-3">
        <div className="text-end">
          <h1 className="m-0 p-0">
            Hi, <span className="font-semibold">John Doe</span>
          </h1>
          <p className="text-sm">john.doe@example.com</p>
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
