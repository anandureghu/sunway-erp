import { Link } from "react-router-dom";
import { ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import type { ElementType, ReactNode } from "react";

export interface TabItem<
  TProps extends Record<string, unknown> = Record<string, unknown>,
> {
  value: string;
  label: string;
  icon?: ReactNode;
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
  variant?: "primary" | "success" | "warning" | "danger" | "ledger";
  backTo?: string;
  icon?: ElementType;
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
  icon: Icon = Settings,
}: AppTabProps<TProps>) => {
  const variantGradients: Record<string, string> = {
    primary: "from-violet-600 via-indigo-600 to-blue-600",
    success: "from-emerald-600 via-teal-600 to-cyan-600",
    warning: "from-amber-500 via-orange-500 to-red-500",
    danger: "from-rose-600 via-pink-600 to-fuchsia-600",
    ledger: "from-slate-800 via-cyan-800 to-teal-700",
  };

  return (
    <div className={className ?? "p-2"}>
      {title && (
        <div
          className={`relative overflow-hidden rounded-2xl px-6 py-6 shadow-lg bg-gradient-to-r ${variantGradients[variant] ?? variantGradients.primary}`}
        >
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 left-1/4 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl" />
          <div className="relative flex items-center gap-4">
            {backTo && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-white hover:bg-white/20 hover:text-white rounded-lg mt-1"
                asChild
              >
                <Link to={backTo} aria-label="Go back">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">{title}</h1>
              {subtitle && (
                <h2 className="text-sm text-white/70 font-light mt-1">
                  {subtitle}
                </h2>
              )}
            </div>
          </div>
        </div>
      )}

      <Tabs
        defaultValue={defaultValue ?? tabs[0]?.value}
        className="w-full pt-2"
      >
        <div className="w-full overflow-x-auto overscroll-x-contain [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]">
          <TabsList className="inline-flex min-w-max w-max flex-nowrap">
            {tabs.map((tab) => (
              <StyledTabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 shrink-0 whitespace-nowrap"
              >
                {tab.icon && (
                  <div className="size-4 rounded-full flex items-center justify-center">
                    {tab.icon}
                  </div>
                )}
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
