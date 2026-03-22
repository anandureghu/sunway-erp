import { useSidebar } from "@/components/ui/sidebar";

/**
 * When the desktop sidebar is collapsed (off-canvas), a thin hit-area on the
 * left edge of the viewport opens the sidebar on hover — similar to IDEs and
 * some admin shells.
 */
export function SidebarEdgeHoverOpen() {
  const { open, setOpen, isMobile } = useSidebar();
  if (isMobile || open) return null;
  return (
    <div
      data-sidebar="edge-strip"
      className="pointer-events-auto fixed left-0 top-0 z-[25] h-svh w-3 bg-transparent"
      onMouseEnter={() => setOpen(true)}
      aria-hidden
    />
  );
}
