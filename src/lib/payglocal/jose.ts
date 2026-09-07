/**
 * JWE + JWS tokens matching PayGlocal's official JS client
 * (RSA-OAEP-256 / A128CBC-HS256 + RS256 digest of the JWE).
 */

import { createHash, createPrivateKey, createPublicKey } from 'node:crypto';
import { CompactEncrypt, CompactSign, compactVerify, importPKCS8, importSPKI, importX509 } from 'jose';
import { getPayGlocalConfig } from './config';

const JWE_ALG = 'RSA-OAEP-256';
const JWE_ENC = 'A128CBC-HS256';
const JWS_ALG = 'RS256';
const TOKEN_EXP_MS = 300_000;

function asPem(key: string) {
  return key.includes('-----BEGIN') ? key : `-----BEGIN PUBLIC KEY-----\n${key}\n-----END PUBLIC KEY-----`;
}

function toPkcs8Pem(privateKeyPem: string) {
  if (privateKeyPem.includes('BEGIN PRIVATE KEY')) return privateKeyPem;
  return createPrivateKey(privateKeyPem).export({ type: 'pkcs8', format: 'pem' }).toString();
}

function toSpkiPem(publicKeyPem: string) {
  if (publicKeyPem.includes('BEGIN PUBLIC KEY')) return publicKeyPem;
  if (publicKeyPem.includes('BEGIN CERTIFICATE')) return publicKeyPem;
  return createPublicKey(asPem(publicKeyPem)).export({ type: 'spki', format: 'pem' }).toString();
}

async function loadPrivateKey() {
  const { privateKey } = getPayGlocalConfig();
  return importPKCS8(toPkcs8Pem(privateKey), JWS_ALG);
}

async function loadPayGlocalPublicKey() {
  const { publicKey } = getPayGlocalConfig();
  const pem = toSpkiPem(publicKey);
  if (pem.includes('BEGIN CERTIFICATE')) return importX509(pem, JWE_ALG);
  return importSPKI(pem, JWE_ALG);
}

function digestObject(payload: string) {
  return {
    digest: createHash('sha256').update(payload).digest('base64'),
    digestAlgorithm: 'SHA-256',
    exp: TOKEN_EXP_MS,
    iat: `${Date.now()}`,
  };
}

export async function encryptPayload(payload: unknown) {
  const { merchantId, publicKeyId } = getPayGlocalConfig();
  const key = await loadPayGlocalPublicKey();
  return new CompactEncrypt(new TextEncoder().encode(JSON.stringify(payload)))
    .setProtectedHeader({
      'issued-by': merchantId,
      enc: JWE_ENC,
      exp: TOKEN_EXP_MS,
      iat: `${Date.now()}`,
      alg: JWE_ALG,
      kid: publicKeyId,
    })
    .encrypt(key);
}

export async function signJws(payload: string, encrypted: boolean) {
  const { merchantId, privateKeyId } = getPayGlocalConfig();
  const key = await loadPrivateKey();
  return new CompactSign(new TextEncoder().encode(JSON.stringify(digestObject(payload))))
    .setProtectedHeader({
      alg: JWS_ALG,
      kid: privateKeyId,
      'x-gl-merchantId': merchantId,
      'issued-by': merchantId,
      'is-digested': 'true',
      'x-gl-enc': encrypted ? 'true' : 'false',
    })
    .sign(key);
}

export async function generateJweAndJws(payload: unknown) {
  const jweToken = await encryptPayload(payload);
  const jwsToken = await signJws(jweToken, true);
  return { jweToken, jwsToken };
}

/** Verify a callback JWT signed by PayGlocal. */
export async function verifyPayGlocalJwt(token: string): Promise<Record<string, unknown>> {
  const { publicKey } = getPayGlocalConfig();
  const pem = toSpkiPem(publicKey);
  const key = pem.includes('BEGIN CERTIFICATE')
    ? await importX509(pem, JWS_ALG)
    : await importSPKI(pem, JWS_ALG);

  const { payload, protectedHeader } = await compactVerify(token, key);
  if (protectedHeader.alg !== JWS_ALG) {
    throw new Error(`PayGlocal callback alg ${String(protectedHeader.alg)} is not ${JWS_ALG}`);
  }
  const parsed: unknown = JSON.parse(new TextDecoder().decode(payload));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('PayGlocal callback payload is not an object');
  }
  return parsed as Record<string, unknown>;
}
