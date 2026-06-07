import * as React from "react";
import { cn } from "@/lib/utils";
import type { TabsTriggerProps } from "@radix-ui/react-tabs";
import { TabsTrigger } from "./ui/tabs";

/**
 * Base style shared by all tab triggers.
 * Uses data attributes for active/inactive states.
 */
const tabTriggerBase = `
  px-4 py-2.5 text-sm font-medium rounded-lg transition-all
  data-[state=active]:bg-gradient-to-r data-[state=active]:from-slate-800 data-[state=active]:to-indigo-900
  data-[state=active]:text-white data-[state=active]:shadow-sm
  data-[state=inactive]:text-slate-600
  data-[state=inactive]:hover:bg-slate-50 data-[state=inactive]:hover:text-slate-900
`;
/**
 * StyledTabsTrigger extends ShadCN’s TabsTrigger
 * - Keeps type safety
 * - Supports custom className
 * - Fully compatible with Tabs system
 */
export interface StyledTabsTriggerProps extends TabsTriggerProps {
  /** Optional override for styles */
  className?: string;
  /** Optional test id (useful for testing) */
  "data-testid"?: string;
}

export const StyledTabsTrigger = React.forwardRef<
  HTMLButtonElement,
  StyledTabsTriggerProps
>(({ className, ...props }, ref) => (
  <TabsTrigger ref={ref} className={cn(tabTriggerBase, className)} {...props} />
));

StyledTabsTrigger.displayName = "StyledTabsTrigger";
