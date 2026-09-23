import { describe, it, expect } from 'vitest';
import { formatLogoBytes, validateLogoFile } from '@/lib/logo';

function makeFile(name: string, type: string, size: number): File {
  const bytes = new Uint8Array(size);
  return new File([bytes], name, { type });
}

describe('validateLogoFile', () => {
  it('rejects missing file', () => {
    expect(validateLogoFile(null)).toMatch(/choose/i);
    expect(validateLogoFile(undefined)).toMatch(/choose/i);
  });

  it('accepts png/jpeg/webp/svg', () => {
    expect(validateLogoFile(makeFile('logo.png', 'image/png', 1024))).toBeNull();
    expect(validateLogoFile(makeFile('logo.jpg', 'image/jpeg', 1024))).toBeNull();
    expect(validateLogoFile(makeFile('logo.webp', 'image/webp', 1024))).toBeNull();
    expect(validateLogoFile(makeFile('logo.svg', 'image/svg+xml', 1024))).toBeNull();
  });

  it('rejects non-image files', () => {
    expect(validateLogoFile(makeFile('doc.pdf', 'application/pdf', 1024))).toMatch(/image/i);
  });

  it('rejects oversized logos', () => {
    const big = makeFile('big.png', 'image/png', 6 * 1024 * 1024);
    expect(validateLogoFile(big)).toMatch(/too large/i);
  });
});

describe('formatLogoBytes', () => {
  it('formats bytes', () => {
    expect(formatLogoBytes(512)).toBe('512 B');
    expect(formatLogoBytes(2048)).toContain('KB');
    expect(formatLogoBytes(5 * 1024 * 1024)).toContain('MB');
  });
});
