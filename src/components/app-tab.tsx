import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";

export interface TabItem<
  TProps extends Record<string, unknown> = Record<string, unknown>,
> {
  value: string;
  label: string;
  element?: React.ReactNode | ((props: TProps) => React.ReactNode);
}

interface AppTabProps<
  TProps extends Record<string, unknown> = Record<string, unknown>,
> {
  title?: string;
  tabs: TabItem<TProps>[];
  defaultValue?: string;
  props?: TProps;
  className?: string;
  subtitle?: string;
  variant?: "primary" | "success" | "warning" | "danger";
  backTo?: string;
}

export const AppTab = <TProps extends Record<string, unknown>>({
  title,
  tabs,
  defaultValue,
  props,
  className,
  subtitle,
  variant = "primary",
  backTo,
}: AppTabProps<TProps>) => {
  return (
    <div className={className ?? "p-6"}>
      {title && (
        <div
          className={`mb-2 text-white rounded-lg p-6 px-10 ${variant === "primary" ? "bg-primary-gradient" : variant === "success" ? "bg-success-gradient" : variant === "warning" ? "bg-warning-gradient" : "bg-danger-gradient"}`}
        >
          <div className="flex items-start gap-3">
            {backTo && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white rounded-lg mt-1" asChild>
                <Link to={backTo} aria-label="Go back"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
            )}
            <div>
              <h1 className="text-4xl font-display font-light">{title}</h1>
              {subtitle && (
                <h2 className="text-sm text-white/70 font-light mt-1">{subtitle}</h2>
              )}
            </div>
          </div>
        </div>
      )}

      <Tabs
        defaultValue={defaultValue ?? tabs[0]?.value}
        className="w-full pt-4"
      >
        <div className="w-full overflow-x-auto overscroll-x-contain [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
          <TabsList className="inline-flex min-w-max w-max flex-nowrap">
            {tabs.map((tab) => (
              <StyledTabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-none shrink-0 whitespace-nowrap"
              >
                {tab.label}
              </StyledTabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="pt-6">
            {typeof tab.element === "function"
              ? tab.element(props as TProps)
              : tab.element || <div>{tab.label} Content</div>}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
