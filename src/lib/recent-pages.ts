export type RecentPage = {
  path: string;
  title: string;
  visitedAt: number;
};

const STORAGE_KEY = "sunway:recent-pages";
const MAX_ITEMS = 12;

const SKIP_PREFIXES = [
  "/login",
  "/auth",
  "/verify",
  "/forgot",
  "/reset",
  "/public",
];

function storageKey(companyId?: number | null): string {
  return companyId != null ? `${STORAGE_KEY}:${companyId}` : STORAGE_KEY;
}

function titleFromPath(path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return "Home";
  const last = segments[segments.length - 1] ?? "";
  if (/^\d+$/.test(last) && segments.length >= 2) {
    return segments[segments.length - 2]!
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return last.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function readRecentPages(companyId?: number | null): RecentPage[] {
  try {
    const raw = localStorage.getItem(storageKey(companyId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentPage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordRecentPage(
  path: string,
  companyId?: number | null,
  title?: string,
): RecentPage[] {
  const clean = path.split("?")[0]?.split("#")[0] || "/";
  if (clean === "/" || clean === "") return readRecentPages(companyId);
  if (SKIP_PREFIXES.some((p) => clean.startsWith(p))) {
    return readRecentPages(companyId);
  }

  const entry: RecentPage = {
    path: clean,
    title: title?.trim() || titleFromPath(clean),
    visitedAt: Date.now(),
  };

  const next = [
    entry,
    ...readRecentPages(companyId).filter((p) => p.path !== clean),
  ].slice(0, MAX_ITEMS);

  try {
    localStorage.setItem(storageKey(companyId), JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
  return next;
}
