import type { RatingScale, Phase } from "./appraisal-types";

// ── Constants (UI only, no business data) ─────────────────────────────────
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

// Default rating scale — purely for display until backend returns one
export const FALLBACK_RATING_SCALE: RatingScale[] = [
  {
    score: 5,
    label: "Exceptional",
    definition:
      "Consistently exceeds all expectations with outstanding results.",
  },
  {
    score: 4,
    label: "Exceeds Expectations",
    definition: "Regularly surpasses goals and competency requirements.",
  },
  {
    score: 3,
    label: "Meets Expectations",
    definition: "Fully meets all goals and competency standards.",
  },
  {
    score: 2,
    label: "Needs Improvement",
    definition: "Partially meets goals. Specific development actions required.",
  },
  {
    score: 1,
    label: "Unsatisfactory",
    definition: "Fails to meet minimum requirements. PIP triggered.",
  },
];

export const FALLBACK_PHASES: Phase[] = [
  {
    id: "goal-setting",
    label: "Goal Setting",
    icon: "🎯",
    description: "HR defines SMART goals per role.",
    startDate: `${CURRENT_YEAR}-01-01`,
    endDate: `${CURRENT_YEAR}-01-31`,
    enabled: true,
  },
  {
    id: "mid-year",
    label: "Mid-Year Review",
    icon: "📊",
    description: "Progress check-in and goal adjustments.",
    startDate: `${CURRENT_YEAR}-06-01`,
    endDate: `${CURRENT_YEAR}-06-30`,
    enabled: true,
  },
  {
    id: "self-assessment",
    label: "Self-Assessment",
    icon: "📝",
    description: "Employee rates themselves against KPIs.",
    startDate: `${CURRENT_YEAR}-11-01`,
    endDate: `${CURRENT_YEAR}-11-15`,
    enabled: true,
  },
  {
    id: "manager-review",
    label: "Manager Review",
    icon: "👤",
    description: "Manager completes ratings with self-assessment visible.",
    startDate: `${CURRENT_YEAR}-11-15`,
    endDate: `${CURRENT_YEAR}-12-05`,
    enabled: true,
  },
  {
    id: "review-meeting",
    label: "Review Meeting",
    icon: "🤝",
    description: "Final one-on-one, sign-off and evaluation locked.",
    startDate: `${CURRENT_YEAR}-12-15`,
    endDate: `${CURRENT_YEAR}-12-31`,
    enabled: true,
  },
];

export const TABS = [
  { id: "cycle", label: "Cycle Setup", icon: "📅" },
  { id: "goals", label: "Goals & KPIs", icon: "🎯" },
  { id: "ratings", label: "Rating Scale", icon: "⭐" },
  { id: "phases", label: "Timeline Phases", icon: "🗓️" },
  { id: "manager", label: "Manager Ratings", icon: "👤" },
  { id: "preview", label: "Preview & Save", icon: "✅" },
] as const;
