import CompanyDetailPage from "../hr/company-detail-page";

// ─── Types ──────────────────────────────────────────────────────────────────

// ─── Main Component ────────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-7">
        <CompanyDetailPage />
      </div>
    </div>
  );
}