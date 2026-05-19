export const CUSTOM_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const CUSTOM_UPLOAD_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;

type CustomUploadMimeType = (typeof CUSTOM_UPLOAD_MIME_TYPES)[number];

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function asciiAt(bytes: Uint8Array, start: number, value: string) {
  return value.split('').every((char, index) => bytes[start + index] === char.charCodeAt(0));
}

export function isCustomUploadMimeType(value: string): value is CustomUploadMimeType {
  return CUSTOM_UPLOAD_MIME_TYPES.includes(value as CustomUploadMimeType);
}

export function isAllowedUploadSignature(mimeType: string, bytes: Uint8Array) {
  if (!isCustomUploadMimeType(mimeType) || bytes.length < 4) return false;

  switch (mimeType) {
    case 'image/jpeg':
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case 'image/png':
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case 'image/webp':
      return bytes.length >= 12 && asciiAt(bytes, 0, 'RIFF') && asciiAt(bytes, 8, 'WEBP');
    case 'application/pdf':
      return startsWith(bytes, [0x25, 0x50, 0x44, 0x46]);
    default:
      return false;
  }
}