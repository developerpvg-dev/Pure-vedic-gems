import { describe, expect, it } from 'vitest';
import { isAllowedUploadSignature, isCustomUploadMimeType } from '@/lib/security/file-validation';

describe('custom upload file validation', () => {
  it('accepts supported MIME types only', () => {
    expect(isCustomUploadMimeType('image/jpeg')).toBe(true);
    expect(isCustomUploadMimeType('image/svg+xml')).toBe(false);
  });

  it('checks image and PDF magic bytes', () => {
    expect(isAllowedUploadSignature('image/jpeg', new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(isAllowedUploadSignature('image/png', new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe(true);
    expect(isAllowedUploadSignature('image/webp', new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4, 87, 69, 66, 80]))).toBe(true);
    expect(isAllowedUploadSignature('application/pdf', new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]))).toBe(true);
  });

  it('rejects spoofed file content', () => {
    const htmlBytes = new TextEncoder().encode('<script>alert(1)</script>');

    expect(isAllowedUploadSignature('image/png', htmlBytes)).toBe(false);
    expect(isAllowedUploadSignature('application/pdf', htmlBytes)).toBe(false);
  });
});