import * as React from "react";
import { cn } from "@/lib/utils";
import type { TabsTriggerProps } from "@radix-ui/react-tabs";
import { TabsTrigger } from "./ui/tabs";

/**
 * Base style shared by all tab triggers.
 * Uses data attributes for active/inactive states.
 */
const tabTriggerBase = `
  px-4 py-2 text-sm font-medium rounded-md transition-colors
  data-[state=active]:bg-blue-600 data-[state=active]:text-white
  data-[state=inactive]:text-gray-600
  data-[state=inactive]:hover:text-blue-600
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
