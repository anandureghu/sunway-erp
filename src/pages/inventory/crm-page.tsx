import { Link } from "react-router-dom";
import { Handshake, Truck, Users, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { canView } from "@/service/companyService";
import { InventoryModule } from "@/lib/module-permissions";

export default function CrmPage() {
  const { permissions, user } = useAuth();
  const isAdmin =
    (user?.role ?? "").toString().toUpperCase() === "ADMIN" ||
    (user?.role ?? "").toString().toUpperCase() === "SUPER_ADMIN";
  const allow = (module: string) =>
    isAdmin || permissions === null || canView(permissions, module);

  const cards = [
    allow(InventoryModule.SALES)
      ? {
          title: "Customers",
          description:
            "Customer profiles, contacts, and sales relationship data.",
          to: "/inventory/sales/customers",
          cta: "Manage customers",
          icon: Users,
        }
      : null,
    allow(InventoryModule.PURCHASE)
      ? {
          title: "Suppliers",
          description:
            "Supplier / vendor profiles used across procurement and payables.",
          to: "/inventory/purchase/suppliers",
          cta: "Manage suppliers",
          icon: Truck,
        }
      : null,
  ].filter(Boolean) as {
    title: string;
    description: string;
    to: string;
    cta: string;
    icon: typeof Users;
  }[];

  return (
    <div className="mx-auto w-full space-y-6 p-4 sm:p-6 py-2">
      <PageHeader
        title="CRM"
        description="Customer Relationship Management — customers and suppliers in one place."
        icon={<Handshake className="w-6 h-6" />}
        variant="darkGreen"
      />

      {cards.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            You do not have permission to view customers or suppliers.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <Card key={card.title} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <card.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      {card.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild className="w-full sm:w-auto">
                  <Link to={card.to}>
                    {card.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
