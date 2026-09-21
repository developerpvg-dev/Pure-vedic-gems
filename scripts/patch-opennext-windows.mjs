/**
 * OpenNext Windows fixes (idempotent):
 * 1) symlinkSync EPERM → copy (dereference)
 * 2) always alias @opentelemetry/api → next/dist/compiled/... in Node middleware esbuild
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function patchSymlinkFallback() {
  const target = path.join(root, 'node_modules/@opennextjs/aws/dist/build/copyTracedFiles.js');
  if (!existsSync(target)) {
    console.warn('patch-opennext-windows: copyTracedFiles.js not found');
    return;
  }
  const MARKER = '/* pvg-windows-symlink-fallback */';
  let src = readFileSync(target, 'utf8');
  if (src.includes(MARKER)) {
    console.log('patch-opennext-windows: symlink fallback already patched');
    return;
  }
  if (!/\bcpSync\b/.test(src.slice(0, 300))) {
    src = src.replace('copyFileSync, existsSync', 'copyFileSync, cpSync, existsSync');
    src = src.replace('copyFileSync, cpSync, existsSync', 'copyFileSync, cpSync, existsSync');
    if (!src.includes('cpSync')) {
      src = src.replace('import { chmodSync, copyFileSync,', 'import { chmodSync, copyFileSync, cpSync,');
    }
  }
  const needle = `        if (symlink) {
            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                if (e.code !== "EEXIST") {
                    throw e;
                }
            }
        }`;
  const replacement = `        if (symlink) {
            try {
                symlinkSync(symlink, to);
            }
            catch (e) {
                ${MARKER}
                if (e.code === "EPERM" || e.code === "ENOSYS") {
                    try {
                        const resolved = path.isAbsolute(symlink)
                            ? symlink
                            : path.resolve(path.dirname(from), symlink);
                        const srcPath = existsSync(resolved) ? resolved : from;
                        const st = statSync(srcPath);
                        if (st.isDirectory()) {
                            cpSync(srcPath, to, { recursive: true, dereference: true });
                        } else {
                            copyFileAndMakeOwnerWritable(srcPath, to);
                        }
                    } catch (copyErr) {
                        logger.debug("Error copying symlink target:", copyErr);
                        erroredFiles.push(to);
                    }
                } else if (e.code !== "EEXIST") {
                    throw e;
                }
            }
        }`;
  if (!src.includes(needle)) {
    console.warn('patch-opennext-windows: symlink needle not found');
    return;
  }
  writeFileSync(target, src.replace(needle, replacement));
  console.log('patch-opennext-windows: patched symlink EPERM fallback');
}

function patchOtelAlias() {
  const mid = path.join(
    root,
    'node_modules/@opennextjs/cloudflare/dist/cli/build/open-next/bundle-node-middleware.js',
  );
  if (!existsSync(mid)) {
    console.warn('patch-opennext-windows: bundle-node-middleware.js not found');
    return;
  }
  const midMarker = '/* pvg-otel-alias */';
  let midSrc = readFileSync(mid, 'utf8');
  if (midSrc.includes(midMarker)) {
    console.log('patch-opennext-windows: otel alias already forced');
    return;
  }
  const from = `...(hasOpentelemetry ? {} : { "@opentelemetry/api": "next/dist/compiled/@opentelemetry/api" }),`;
  const to = `${midMarker}...({ "@opentelemetry/api": "next/dist/compiled/@opentelemetry/api" }),`;
  if (!midSrc.includes(from)) {
    console.warn('patch-opennext-windows: middleware otel alias pattern not found');
    return;
  }
  writeFileSync(mid, midSrc.replace(from, to));
  console.log('patch-opennext-windows: forced otel alias in middleware bundle');
}

patchSymlinkFallback();
patchOtelAlias();
