export type PlatformSettings = {
  id?: number;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  bankName?: string | null;
  iban?: string | null;
};

export type PlatformSettingsRequest = {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  bankName?: string | null;
  iban?: string | null;
};
