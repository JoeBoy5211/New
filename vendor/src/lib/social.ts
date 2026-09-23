export type SocialPlatform = 'instagram' | 'tiktok' | 'telegram';

export interface SocialLink {
  platform: SocialPlatform;
  href: string;
  label: string;
}

const BASE_URL: Record<SocialPlatform, string> = {
  instagram: 'https://instagram.com/',
  tiktok: 'https://www.tiktok.com/@',
  telegram: 'https://t.me/',
};

function stripHandlePrefix(platform: SocialPlatform, handle: string): string {
  let h = handle.trim();
  if (platform === 'tiktok' || platform === 'telegram' || platform === 'instagram') {
    h = h.replace(/^@+/, '');
  }
  // Allow pasting full handles like "instagram.com/foo" — take last segment
  if (!h.includes('://') && h.includes('/')) {
    const parts = h.split('/').filter(Boolean);
    h = parts[parts.length - 1] ?? h;
    h = h.replace(/^@+/, '');
  }
  return h;
}

/**
 * Normalize vendor input into a full external URL.
 * Accepts full URLs, bare domains, or @handles. Returns null when empty.
 * All socials are optional — empty input means "not shared".
 */
export function normalizeSocialUrl(platform: SocialPlatform, raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const value = raw.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  // Bare domain pasted without protocol (e.g. "instagram.com/foo")
  if (/^[a-z0-9-]+\.[a-z]{2,}(\/\S*)?$/i.test(value)) return `https://${value}`;
  const handle = stripHandlePrefix(platform, value);
  if (!handle) return null;
  // Guard against spaces / invalid handle pastes
  if (/\s/.test(handle)) return value.startsWith('@') ? `${BASE_URL[platform]}${handle.replace(/\s+/g, '')}` : null;
  return `${BASE_URL[platform]}${handle}`;
}

type SocialFields = {
  instagram_url?: string | null;
  tiktok_url?: string | null;
  telegram_url?: string | null;
  // Tolerate legacy/alternate column names if a different migration was applied
  instagram?: string | null;
  tiktok?: string | null;
  telegram?: string | null;
};

const SOCIAL_META: { platform: SocialPlatform; label: string; keys: (keyof SocialFields)[] }[] = [
  { platform: 'instagram', label: 'Instagram', keys: ['instagram_url', 'instagram'] },
  { platform: 'tiktok', label: 'TikTok', keys: ['tiktok_url', 'tiktok'] },
  { platform: 'telegram', label: 'Telegram', keys: ['telegram_url', 'telegram'] },
];

/** Collect display-ready social links, skipping empty/optional ones. */
export function getSocialLinks(source: SocialFields | null | undefined): SocialLink[] {
  if (!source) return [];
  const links: SocialLink[] = [];
  for (const { platform, label, keys } of SOCIAL_META) {
    const raw = keys.map((k) => source[k]).find((v) => typeof v === 'string' && v.trim());
    const href = normalizeSocialUrl(platform, typeof raw === 'string' ? raw : null);
    if (href) links.push({ platform, href, label });
  }
  return links;
}
