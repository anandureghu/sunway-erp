import { useCallback, useEffect, useState } from "react";
import { appraisalService } from "@/service/appraisalService";
import { fetchHrPolicies } from "@/service/companyService";
import { hrService } from "@/service/hr.service";
import { leaveService } from "@/service/leaveService";
import {
  buildHrDashboardInsights,
  type HrDashboardInsights,
} from "@/lib/hr-dashboard-analytics";
import type { HrDashboard } from "@/types/hrDashboard";

const EMPTY_INSIGHTS: HrDashboardInsights = buildHrDashboardInsights({
  employees: [],
  underProbation: [],
  appraisals: [],
  leaveHistory: [],
  dashboard: null,
});

export function useHrDashboardInsights(
  dashboard: HrDashboard | null,
  companyId?: number | string,
) {
  const [insights, setInsights] = useState<HrDashboardInsights>(EMPTY_INSIGHTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const year = new Date().getFullYear();
    try {
      const [employees, underProbation, appraisalPage, leaveHistoryRes] =
        await Promise.all([
          hrService.listEmployees(),
          hrService.listUnderProbation(),
          appraisalService.listByYear(year, 0, 500).catch(() => ({
            content: [],
            totalElements: 0,
            totalPages: 0,
            size: 0,
            number: 0,
          })),
          leaveService.fetchLeaveApprovalsHistory(false),
        ]);

      let probationMonths = 3;
      if (companyId != null) {
        try {
          const policies = await fetchHrPolicies(Number(companyId));
          if (policies.probationPeriodMonths != null) {
            probationMonths = policies.probationPeriodMonths;
          }
        } catch {
          // Use default probation months.
        }
      }

      const leaveHistory = Array.isArray(leaveHistoryRes.data)
        ? leaveHistoryRes.data
        : [];

      setInsights(
        buildHrDashboardInsights({
          employees,
          underProbation,
          appraisals: appraisalPage.content ?? [],
          leaveHistory,
          dashboard,
          probationMonths,
        }),
      );
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Could not load HR insights";
      setError(message);
      setInsights(
        buildHrDashboardInsights({
          employees: [],
          underProbation: [],
          appraisals: [],
          leaveHistory: [],
          dashboard,
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [companyId, dashboard]);

  useEffect(() => {
    void load();
  }, [load]);

  return { insights, loading, error, refresh: load };
}
