export const ADMIN_EMAILS = [
  "gtrevor025@gmail.com",
  "tngure20@gmail.com",
];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

const SETTINGS_KEY = "harvest_site_settings";

export interface SiteSettings {
  siteName: string;
  tagline: string;
  announcementBanner: string;
  announcementEnabled: boolean;
  maintenanceMode: boolean;
  enableMarketplace: boolean;
  enableCommunity: boolean;
  enableExperts: boolean;
  enableFarmAssistant: boolean;
  allowNewSignups: boolean;
  requireApprovalForListings: boolean;
}

const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Harvest",
  tagline: "Connecting farmers across Africa",
  announcementBanner: "",
  announcementEnabled: false,
  maintenanceMode: false,
  enableMarketplace: true,
  enableCommunity: true,
  enableExperts: true,
  enableFarmAssistant: true,
  allowNewSignups: true,
  requireApprovalForListings: false,
};

export function getSiteSettings(): SiteSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function updateSiteSettings(updates: Partial<SiteSettings>) {
  const current = getSiteSettings();
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...updates }));
}
