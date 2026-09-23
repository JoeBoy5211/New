import { describe, it, expect } from 'vitest';
import { validateLicenceFile, licenceStoragePath, formatBytes, MAX_LICENCE_BYTES } from './licence';

function pdf(name = 'licence.pdf', size = 1024, type = 'application/pdf'): File {
  const bytes = new Uint8Array(size);
  return new File([bytes], name, { type });
}

describe('licenceStoragePath', () => {
  it('scopes the file to the vendor folder with a fixed name', () => {
    expect(licenceStoragePath('user-123')).toBe('user-123/business-licence.pdf');
  });
});

describe('validateLicenceFile', () => {
  it('requires a file', () => {
    expect(validateLicenceFile(null)).toMatch(/attach/i);
    expect(validateLicenceFile(undefined)).toMatch(/attach/i);
  });

  it('accepts a valid PDF', () => {
    expect(validateLicenceFile(pdf())).toBeNull();
  });

  it('accepts empty MIME when the extension is .pdf', () => {
    expect(validateLicenceFile(pdf('scan.pdf', 512, ''))).toBeNull();
  });

  it('rejects non-PDF files', () => {
    expect(validateLicenceFile(pdf('photo.png', 1024, 'image/png'))).toMatch(/PDF/i);
    expect(validateLicenceFile(pdf('notes.txt', 1024, 'text/plain'))).toMatch(/PDF/i);
    // Right MIME but wrong extension still fails (never trust MIME alone).
    expect(validateLicenceFile(pdf('licence.doc', 1024, 'application/pdf'))).toMatch(/PDF/i);
  });

  it('rejects empty and oversized files', () => {
    expect(validateLicenceFile(pdf('empty.pdf', 0))).toMatch(/empty/i);
    expect(validateLicenceFile(pdf('big.pdf', MAX_LICENCE_BYTES + 1))).toMatch(/too large/i);
  });
});

describe('formatBytes', () => {
  it('formats B, KB and MB', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(MAX_LICENCE_BYTES)).toBe('10.0 MB');
  });
});
