import { describe, it, expect } from 'vitest';
import { normalizeSocialUrl, getSocialLinks } from './social';

describe('normalizeSocialUrl', () => {
  it('returns null for empty optional input', () => {
    expect(normalizeSocialUrl('instagram', '')).toBeNull();
    expect(normalizeSocialUrl('tiktok', '   ')).toBeNull();
    expect(normalizeSocialUrl('telegram', null)).toBeNull();
    expect(normalizeSocialUrl('telegram', undefined)).toBeNull();
  });

  it('passes through full URLs', () => {
    expect(normalizeSocialUrl('instagram', 'https://instagram.com/foo')).toBe('https://instagram.com/foo');
    expect(normalizeSocialUrl('tiktok', 'http://www.tiktok.com/@foo')).toBe('http://www.tiktok.com/@foo');
  });

  it('adds https to bare domains', () => {
    expect(normalizeSocialUrl('instagram', 'instagram.com/foo')).toBe('https://instagram.com/foo');
  });

  it('builds profile URLs from handles', () => {
    expect(normalizeSocialUrl('instagram', '@foo')).toBe('https://instagram.com/foo');
    expect(normalizeSocialUrl('instagram', 'foo')).toBe('https://instagram.com/foo');
    expect(normalizeSocialUrl('tiktok', '@foo')).toBe('https://www.tiktok.com/@foo');
    expect(normalizeSocialUrl('telegram', '@mychannel')).toBe('https://t.me/mychannel');
  });
});

describe('getSocialLinks', () => {
  it('skips missing optionals', () => {
    expect(getSocialLinks(null)).toEqual([]);
    expect(getSocialLinks({})).toEqual([]);
    expect(
      getSocialLinks({ instagram_url: '', tiktok_url: null, telegram_url: '  ' }),
    ).toEqual([]);
  });

  it('returns only filled socials with labels', () => {
    const links = getSocialLinks({
      instagram_url: '@foo',
      tiktok_url: null,
      telegram_url: 'https://t.me/bar',
    });
    expect(links).toHaveLength(2);
    expect(links[0]).toEqual({ platform: 'instagram', href: 'https://instagram.com/foo', label: 'Instagram' });
    expect(links[1]).toEqual({ platform: 'telegram', href: 'https://t.me/bar', label: 'Telegram' });
  });
});
