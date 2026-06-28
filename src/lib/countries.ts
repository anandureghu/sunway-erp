// Self-contained country dial-code dataset for phone inputs.
// Flag emojis are derived from the ISO-3166 alpha-2 code at runtime, so the
// data stays compact and there is no risk of a mismatched hard-coded flag.

export type Country = {
  /** Display name */
  name: string;
  /** ISO-3166 alpha-2 code (uppercase) */
  iso2: string;
  /** International dial code, digits only, no leading "+" */
  dial: string;
};

/** Sensible default for this (Qatar-based) deployment. */
export const DEFAULT_COUNTRY_ISO = "QA";

export const COUNTRIES: Country[] = [
  { name: "Afghanistan", iso2: "AF", dial: "93" },
  { name: "Albania", iso2: "AL", dial: "355" },
  { name: "Algeria", iso2: "DZ", dial: "213" },
  { name: "Andorra", iso2: "AD", dial: "376" },
  { name: "Angola", iso2: "AO", dial: "244" },
  { name: "Argentina", iso2: "AR", dial: "54" },
  { name: "Armenia", iso2: "AM", dial: "374" },
  { name: "Australia", iso2: "AU", dial: "61" },
  { name: "Austria", iso2: "AT", dial: "43" },
  { name: "Azerbaijan", iso2: "AZ", dial: "994" },
  { name: "Bahamas", iso2: "BS", dial: "1242" },
  { name: "Bahrain", iso2: "BH", dial: "973" },
  { name: "Bangladesh", iso2: "BD", dial: "880" },
  { name: "Barbados", iso2: "BB", dial: "1246" },
  { name: "Belarus", iso2: "BY", dial: "375" },
  { name: "Belgium", iso2: "BE", dial: "32" },
  { name: "Belize", iso2: "BZ", dial: "501" },
  { name: "Benin", iso2: "BJ", dial: "229" },
  { name: "Bhutan", iso2: "BT", dial: "975" },
  { name: "Bolivia", iso2: "BO", dial: "591" },
  { name: "Bosnia and Herzegovina", iso2: "BA", dial: "387" },
  { name: "Botswana", iso2: "BW", dial: "267" },
  { name: "Brazil", iso2: "BR", dial: "55" },
  { name: "Brunei", iso2: "BN", dial: "673" },
  { name: "Bulgaria", iso2: "BG", dial: "359" },
  { name: "Burkina Faso", iso2: "BF", dial: "226" },
  { name: "Burundi", iso2: "BI", dial: "257" },
  { name: "Cambodia", iso2: "KH", dial: "855" },
  { name: "Cameroon", iso2: "CM", dial: "237" },
  { name: "Canada", iso2: "CA", dial: "1" },
  { name: "Cape Verde", iso2: "CV", dial: "238" },
  { name: "Central African Republic", iso2: "CF", dial: "236" },
  { name: "Chad", iso2: "TD", dial: "235" },
  { name: "Chile", iso2: "CL", dial: "56" },
  { name: "China", iso2: "CN", dial: "86" },
  { name: "Colombia", iso2: "CO", dial: "57" },
  { name: "Comoros", iso2: "KM", dial: "269" },
  { name: "Congo (Brazzaville)", iso2: "CG", dial: "242" },
  { name: "Congo (Kinshasa)", iso2: "CD", dial: "243" },
  { name: "Costa Rica", iso2: "CR", dial: "506" },
  { name: "Côte d'Ivoire", iso2: "CI", dial: "225" },
  { name: "Croatia", iso2: "HR", dial: "385" },
  { name: "Cuba", iso2: "CU", dial: "53" },
  { name: "Cyprus", iso2: "CY", dial: "357" },
  { name: "Czechia", iso2: "CZ", dial: "420" },
  { name: "Denmark", iso2: "DK", dial: "45" },
  { name: "Djibouti", iso2: "DJ", dial: "253" },
  { name: "Dominica", iso2: "DM", dial: "1767" },
  { name: "Dominican Republic", iso2: "DO", dial: "1809" },
  { name: "Ecuador", iso2: "EC", dial: "593" },
  { name: "Egypt", iso2: "EG", dial: "20" },
  { name: "El Salvador", iso2: "SV", dial: "503" },
  { name: "Equatorial Guinea", iso2: "GQ", dial: "240" },
  { name: "Eritrea", iso2: "ER", dial: "291" },
  { name: "Estonia", iso2: "EE", dial: "372" },
  { name: "Eswatini", iso2: "SZ", dial: "268" },
  { name: "Ethiopia", iso2: "ET", dial: "251" },
  { name: "Fiji", iso2: "FJ", dial: "679" },
  { name: "Finland", iso2: "FI", dial: "358" },
  { name: "France", iso2: "FR", dial: "33" },
  { name: "Gabon", iso2: "GA", dial: "241" },
  { name: "Gambia", iso2: "GM", dial: "220" },
  { name: "Georgia", iso2: "GE", dial: "995" },
  { name: "Germany", iso2: "DE", dial: "49" },
  { name: "Ghana", iso2: "GH", dial: "233" },
  { name: "Greece", iso2: "GR", dial: "30" },
  { name: "Grenada", iso2: "GD", dial: "1473" },
  { name: "Guatemala", iso2: "GT", dial: "502" },
  { name: "Guinea", iso2: "GN", dial: "224" },
  { name: "Guinea-Bissau", iso2: "GW", dial: "245" },
  { name: "Guyana", iso2: "GY", dial: "592" },
  { name: "Haiti", iso2: "HT", dial: "509" },
  { name: "Honduras", iso2: "HN", dial: "504" },
  { name: "Hong Kong", iso2: "HK", dial: "852" },
  { name: "Hungary", iso2: "HU", dial: "36" },
  { name: "Iceland", iso2: "IS", dial: "354" },
  { name: "India", iso2: "IN", dial: "91" },
  { name: "Indonesia", iso2: "ID", dial: "62" },
  { name: "Iran", iso2: "IR", dial: "98" },
  { name: "Iraq", iso2: "IQ", dial: "964" },
  { name: "Ireland", iso2: "IE", dial: "353" },
  { name: "Israel", iso2: "IL", dial: "972" },
  { name: "Italy", iso2: "IT", dial: "39" },
  { name: "Jamaica", iso2: "JM", dial: "1876" },
  { name: "Japan", iso2: "JP", dial: "81" },
  { name: "Jordan", iso2: "JO", dial: "962" },
  { name: "Kazakhstan", iso2: "KZ", dial: "7" },
  { name: "Kenya", iso2: "KE", dial: "254" },
  { name: "Kiribati", iso2: "KI", dial: "686" },
  { name: "Kuwait", iso2: "KW", dial: "965" },
  { name: "Kyrgyzstan", iso2: "KG", dial: "996" },
  { name: "Laos", iso2: "LA", dial: "856" },
  { name: "Latvia", iso2: "LV", dial: "371" },
  { name: "Lebanon", iso2: "LB", dial: "961" },
  { name: "Lesotho", iso2: "LS", dial: "266" },
  { name: "Liberia", iso2: "LR", dial: "231" },
  { name: "Libya", iso2: "LY", dial: "218" },
  { name: "Liechtenstein", iso2: "LI", dial: "423" },
  { name: "Lithuania", iso2: "LT", dial: "370" },
  { name: "Luxembourg", iso2: "LU", dial: "352" },
  { name: "Macau", iso2: "MO", dial: "853" },
  { name: "Madagascar", iso2: "MG", dial: "261" },
  { name: "Malawi", iso2: "MW", dial: "265" },
  { name: "Malaysia", iso2: "MY", dial: "60" },
  { name: "Maldives", iso2: "MV", dial: "960" },
  { name: "Mali", iso2: "ML", dial: "223" },
  { name: "Malta", iso2: "MT", dial: "356" },
  { name: "Marshall Islands", iso2: "MH", dial: "692" },
  { name: "Mauritania", iso2: "MR", dial: "222" },
  { name: "Mauritius", iso2: "MU", dial: "230" },
  { name: "Mexico", iso2: "MX", dial: "52" },
  { name: "Micronesia", iso2: "FM", dial: "691" },
  { name: "Moldova", iso2: "MD", dial: "373" },
  { name: "Monaco", iso2: "MC", dial: "377" },
  { name: "Mongolia", iso2: "MN", dial: "976" },
  { name: "Montenegro", iso2: "ME", dial: "382" },
  { name: "Morocco", iso2: "MA", dial: "212" },
  { name: "Mozambique", iso2: "MZ", dial: "258" },
  { name: "Myanmar", iso2: "MM", dial: "95" },
  { name: "Namibia", iso2: "NA", dial: "264" },
  { name: "Nauru", iso2: "NR", dial: "674" },
  { name: "Nepal", iso2: "NP", dial: "977" },
  { name: "Netherlands", iso2: "NL", dial: "31" },
  { name: "New Zealand", iso2: "NZ", dial: "64" },
  { name: "Nicaragua", iso2: "NI", dial: "505" },
  { name: "Niger", iso2: "NE", dial: "227" },
  { name: "Nigeria", iso2: "NG", dial: "234" },
  { name: "North Korea", iso2: "KP", dial: "850" },
  { name: "North Macedonia", iso2: "MK", dial: "389" },
  { name: "Norway", iso2: "NO", dial: "47" },
  { name: "Oman", iso2: "OM", dial: "968" },
  { name: "Pakistan", iso2: "PK", dial: "92" },
  { name: "Palau", iso2: "PW", dial: "680" },
  { name: "Palestine", iso2: "PS", dial: "970" },
  { name: "Panama", iso2: "PA", dial: "507" },
  { name: "Papua New Guinea", iso2: "PG", dial: "675" },
  { name: "Paraguay", iso2: "PY", dial: "595" },
  { name: "Peru", iso2: "PE", dial: "51" },
  { name: "Philippines", iso2: "PH", dial: "63" },
  { name: "Poland", iso2: "PL", dial: "48" },
  { name: "Portugal", iso2: "PT", dial: "351" },
  { name: "Qatar", iso2: "QA", dial: "974" },
  { name: "Romania", iso2: "RO", dial: "40" },
  { name: "Russia", iso2: "RU", dial: "7" },
  { name: "Rwanda", iso2: "RW", dial: "250" },
  { name: "Saint Kitts and Nevis", iso2: "KN", dial: "1869" },
  { name: "Saint Lucia", iso2: "LC", dial: "1758" },
  { name: "Samoa", iso2: "WS", dial: "685" },
  { name: "San Marino", iso2: "SM", dial: "378" },
  { name: "Saudi Arabia", iso2: "SA", dial: "966" },
  { name: "Senegal", iso2: "SN", dial: "221" },
  { name: "Serbia", iso2: "RS", dial: "381" },
  { name: "Seychelles", iso2: "SC", dial: "248" },
  { name: "Sierra Leone", iso2: "SL", dial: "232" },
  { name: "Singapore", iso2: "SG", dial: "65" },
  { name: "Slovakia", iso2: "SK", dial: "421" },
  { name: "Slovenia", iso2: "SI", dial: "386" },
  { name: "Solomon Islands", iso2: "SB", dial: "677" },
  { name: "Somalia", iso2: "SO", dial: "252" },
  { name: "South Africa", iso2: "ZA", dial: "27" },
  { name: "South Korea", iso2: "KR", dial: "82" },
  { name: "South Sudan", iso2: "SS", dial: "211" },
  { name: "Spain", iso2: "ES", dial: "34" },
  { name: "Sri Lanka", iso2: "LK", dial: "94" },
  { name: "Sudan", iso2: "SD", dial: "249" },
  { name: "Suriname", iso2: "SR", dial: "597" },
  { name: "Sweden", iso2: "SE", dial: "46" },
  { name: "Switzerland", iso2: "CH", dial: "41" },
  { name: "Syria", iso2: "SY", dial: "963" },
  { name: "Taiwan", iso2: "TW", dial: "886" },
  { name: "Tajikistan", iso2: "TJ", dial: "992" },
  { name: "Tanzania", iso2: "TZ", dial: "255" },
  { name: "Thailand", iso2: "TH", dial: "66" },
  { name: "Timor-Leste", iso2: "TL", dial: "670" },
  { name: "Togo", iso2: "TG", dial: "228" },
  { name: "Tonga", iso2: "TO", dial: "676" },
  { name: "Trinidad and Tobago", iso2: "TT", dial: "1868" },
  { name: "Tunisia", iso2: "TN", dial: "216" },
  { name: "Turkey", iso2: "TR", dial: "90" },
  { name: "Turkmenistan", iso2: "TM", dial: "993" },
  { name: "Tuvalu", iso2: "TV", dial: "688" },
  { name: "Uganda", iso2: "UG", dial: "256" },
  { name: "Ukraine", iso2: "UA", dial: "380" },
  { name: "United Arab Emirates", iso2: "AE", dial: "971" },
  { name: "United Kingdom", iso2: "GB", dial: "44" },
  { name: "United States", iso2: "US", dial: "1" },
  { name: "Uruguay", iso2: "UY", dial: "598" },
  { name: "Uzbekistan", iso2: "UZ", dial: "998" },
  { name: "Vanuatu", iso2: "VU", dial: "678" },
  { name: "Vatican City", iso2: "VA", dial: "379" },
  { name: "Venezuela", iso2: "VE", dial: "58" },
  { name: "Vietnam", iso2: "VN", dial: "84" },
  { name: "Yemen", iso2: "YE", dial: "967" },
  { name: "Zambia", iso2: "ZM", dial: "260" },
  { name: "Zimbabwe", iso2: "ZW", dial: "263" },
];

/** Regional-indicator flag emoji for an ISO-3166 alpha-2 code (e.g. "QA" → 🇶🇦). */
export function flagEmoji(iso2: string): string {
  if (!iso2 || iso2.length !== 2) return "🏳️";
  const A = 0x1f1e6;
  const base = "A".charCodeAt(0);
  const cc = iso2.toUpperCase();
  return (
    String.fromCodePoint(A + (cc.charCodeAt(0) - base)) +
    String.fromCodePoint(A + (cc.charCodeAt(1) - base))
  );
}

export function getCountryByIso(iso2?: string): Country | undefined {
  if (!iso2) return undefined;
  const cc = iso2.toUpperCase();
  return COUNTRIES.find((c) => c.iso2 === cc);
}

export function getCountryByName(name?: string): Country | undefined {
  if (!name) return undefined;
  const needle = name.trim().toLowerCase();
  return COUNTRIES.find((c) => c.name.toLowerCase() === needle);
}

export const DEFAULT_COUNTRY =
  getCountryByIso(DEFAULT_COUNTRY_ISO) ?? COUNTRIES[0];

/**
 * Given a digit stream (no "+"), find the country whose dial code is the
 * longest matching prefix. Longest-match disambiguates e.g. "1868" (Trinidad)
 * from "1" (US/Canada). Shared codes resolve to the first listed country.
 */
export function findCountryByDialPrefix(digits: string): Country | undefined {
  let best: Country | undefined;
  for (const c of COUNTRIES) {
    if (digits.startsWith(c.dial)) {
      if (!best || c.dial.length > best.dial.length) best = c;
    }
  }
  return best;
}

export type ParsedPhone = { country: Country; national: string };

/**
 * Split a stored phone string into a country + national number. Falls back to
 * the default country when no "+<dial>" prefix can be recognised.
 */
export function parsePhone(value?: string): ParsedPhone {
  const raw = (value ?? "").trim();
  if (!raw) return { country: DEFAULT_COUNTRY, national: "" };

  if (raw.startsWith("+")) {
    const digits = raw.slice(1).replace(/\D/g, "");
    const country = findCountryByDialPrefix(digits);
    if (country) {
      return { country, national: digits.slice(country.dial.length) };
    }
    return { country: DEFAULT_COUNTRY, national: digits };
  }

  // No recognisable dial code — treat the whole thing as the national part.
  return { country: DEFAULT_COUNTRY, national: raw.replace(/\D/g, "") };
}

/** Compose the canonical stored form: "+<dial> <national digits>" (or "" if blank). */
export function composePhone(country: Country, national: string): string {
  const digits = (national ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return `+${country.dial} ${digits}`;
}

/** Normalize any stored phone value to the canonical "+<dial> <digits>" form. */
export function normalizePhone(value: string | undefined | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  const { country, national } = parsePhone(raw);
  return composePhone(country, national);
}

export type PhoneValidation = { valid: boolean; message?: string };

/**
 * Validate a stored phone string. Checks the national number is digits only and
 * the total length is within the E.164 range (4–15 digits incl. country code).
 */
export function validatePhone(
  value: string | undefined,
  opts: { required?: boolean } = {},
): PhoneValidation {
  const raw = (value ?? "").trim();
  if (!raw) {
    return opts.required
      ? { valid: false, message: "Phone number is required" }
      : { valid: true };
  }

  const { country, national } = parsePhone(raw);
  if (!national) {
    return { valid: false, message: "Enter a phone number" };
  }
  if (!/^\d+$/.test(national)) {
    return { valid: false, message: "Phone number can only contain digits" };
  }

  const total = country.dial.length + national.length;
  if (national.length < 4) {
    return { valid: false, message: "Phone number is too short" };
  }
  if (total > 15) {
    return { valid: false, message: "Phone number is too long" };
  }
  return { valid: true };
}
