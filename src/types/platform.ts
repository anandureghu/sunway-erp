export type PlatformSettings = {
  id?: number;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  bankName?: string | null;
  accountHolder?: string | null;
  iban?: string | null;
  ifscCode?: string | null;
  branchName?: string | null;
};

export type PlatformSettingsRequest = {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  bankName?: string | null;
  accountHolder?: string | null;
  iban?: string | null;
  ifscCode?: string | null;
  branchName?: string | null;
};
