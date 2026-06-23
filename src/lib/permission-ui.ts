// Shared visual helpers for the permission list views (HR, Finance, Inventory).

// Only ADMIN / SUPER_ADMIN may manage permissions — consistent with the HR
// settings Permissions tab. (The role-management & permission-write endpoints
// are admin-only, so a non-admin would just hit errors.) `permissions === null`
// is the admin bypass marker used across the app.
export function canManagePermissions(
  role: string | undefined,
  permissions: Record<string, any> | null | undefined,
): boolean {
  const upper = (role ?? "").toUpperCase();
  return upper === "ADMIN" || upper === "SUPER_ADMIN" || permissions === null;
}

export const ROLE_STYLES: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  Admin: { bg: "bg-purple-100", color: "text-purple-700", border: "border-purple-200" },
  HR: { bg: "bg-indigo-100", color: "text-indigo-700", border: "border-indigo-200" },
  "Super Admin": { bg: "bg-orange-100", color: "text-orange-700", border: "border-orange-200" },
  "Finance Manager": { bg: "bg-yellow-100", color: "text-yellow-700", border: "border-yellow-200" },
  Accountant: { bg: "bg-green-100", color: "text-green-700", border: "border-green-100" },
  "AP/AR Clerk": { bg: "bg-sky-100", color: "text-sky-700", border: "border-sky-200" },
  Controller: { bg: "bg-pink-100", color: "text-pink-700", border: "border-pink-200" },
  "Auditor (External)": { bg: "bg-red-100", color: "text-red-700", border: "border-red-200" },
  User: { bg: "bg-gray-100", color: "text-gray-700", border: "border-gray-200" },
};

const FALLBACK_ROLE_STYLE = {
  bg: "bg-gray-100",
  color: "text-gray-700",
  border: "border-gray-200",
};

/** Tailwind classes for a role badge (falls back to a neutral grey). */
export function roleBadgeClasses(role: string): string {
  const s = ROLE_STYLES[role] ?? FALLBACK_ROLE_STYLE;
  return `${s.bg} ${s.color} border ${s.border}`;
}

export const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-cyan-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-red-500",
  "bg-pink-500",
];

/** Deterministic avatar colour for a name. */
export function avatarColor(name: string): string {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

/** Up-to-two-letter initials for a name. */
export function nameInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Page-size options for permission lists. */
export const PERMISSION_PAGE_SIZES = [5, 10, 15, 20];
