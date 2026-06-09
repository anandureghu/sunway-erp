export type CompanySummary = {
  id: number;
  companyName: string;
  logoUrl?: string | null;
};

export type JwtLoginResponse = {
  accessToken: string;
  refreshToken: string;
  companies?: CompanySummary[];
  requiresCompanySelection?: boolean;
};

export type UserSearchResult = {
  userId: number;
  fullName: string;
  email: string;
  username: string;
  companyNames: string[];
};

export const ACTIVE_COMPANY_KEY = "sunway.activeCompanyId";
