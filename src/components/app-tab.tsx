import { Card, CardContent } from "@/components/ui/card";
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
}

/**
 * AppTab — Reusable, fully type-safe tab component
 * ------------------------------------------------
 * ✅ Strongly typed generics
 * ✅ No `any`
 * ✅ Works with multiple props
 * ✅ Supports render functions or static nodes
 */
export const AppTab = <TProps extends Record<string, unknown>>({
  title,
  tabs,
  defaultValue,
  props,
  className = "",
}: AppTabProps<TProps>) => {
  return (
    <div className={`p-6 ${className}`}>
      {title && <h1 className="text-2xl font-semibold mb-4">{title}</h1>}

      <Card>
        <CardContent>
          <Tabs
            defaultValue={defaultValue ?? tabs[0]?.value}
            className="w-full"
          >
            <TabsList>
              {tabs.map((tab) => (
                <StyledTabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </StyledTabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="pt-6">
                {typeof tab.element === "function"
                  ? tab.element(props as TProps)
                  : tab.element || <div>{tab.label} Content</div>}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
