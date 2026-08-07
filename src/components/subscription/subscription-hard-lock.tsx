import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export function SubscriptionHardLock() {
  const {
    subscriptionStatus,
    companies,
    switchCompany,
    logout,
    company,
    activeCompanyId,
  } = useAuth();
  const [switching, setSwitching] = useState(false);

  const otherCompanies = companies.filter((c) => c.id !== activeCompanyId);
  const companyName =
    subscriptionStatus?.companyName ||
    company?.companyName ||
    "this company";

  const handleSwitch = async (id: string) => {
    setSwitching(true);
    try {
      await switchCompany(Number(id));
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/40">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
            <img
              src="/assets/logo-dark.svg"
              alt=""
              width={28}
              height={28}
              className="brightness-0 invert"
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Sunway ERP
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">
            Sunway
          </h1>
          <p className="mt-1 text-sm text-white/75">Platform access suspended</p>
        </div>

        <div className="px-8 py-7">
          <h2 className="text-lg font-semibold text-slate-900">
            Subscription expired
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Access to{" "}
            <span className="font-semibold text-slate-900">{companyName}</span>{" "}
            on <span className="font-semibold text-slate-900">Sunway</span> has
            been suspended
            {subscriptionStatus?.endsAt
              ? ` (ended ${subscriptionStatus.endsAt})`
              : ""}
            .
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Contact your platform administrator to renew offline.
            {subscriptionStatus?.billingContactEmail
              ? ` Billing contact: ${subscriptionStatus.billingContactEmail}.`
              : ""}
          </p>

          <div className="mt-6 space-y-3">
            {otherCompanies.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-slate-500">
                  Switch to another company
                </p>
                <Select disabled={switching} onValueChange={handleSwitch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherCompanies.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.companyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out of Sunway
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
