import { resolveLabLogo, inferCertificateLab } from './trust-credentials';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

assert(resolveLabLogo('IGI')?.name === 'IGI', 'exact IGI');
assert(resolveLabLogo('IGI-GTL Delhi')?.name === 'IGI', 'IGI with branch');
assert(resolveLabLogo('IGIGTL')?.name === 'IGI', 'compact IGIGTL');
assert(resolveLabLogo('IGITL')?.name === 'IGI', 'typo IGITL');
assert(resolveLabLogo(null, 'IIGJ Cert.')?.name === 'IIGJ', 'fallback certification');
assert(resolveLabLogo('Gubelin')?.logo === '/labslogo/GUBELIN.webp', 'Gubelin diacritic fold');
assert(resolveLabLogo('HRD Antwerp')?.name === 'HRD Antwerp', 'multi-word lab');
assert(resolveLabLogo('None') === null, 'none lab');
assert(resolveLabLogo('-') === null, 'dash lab');
assert(resolveLabLogo('') === null, 'empty');
assert(
  inferCertificateLab('..., Certified by Govt. Lab.') === 'IGI-GTL',
  'govt lab copy',
);
assert(
  resolveLabLogo(null, null, '..., Certified by Govt. Lab.')?.name === 'IGI',
  'govt lab resolves to IGI logo',
);
assert(inferCertificateLab('IGI-GTL-12345') === 'IGI-GTL', 'cert number');

console.log('trust-credentials.selfcheck: ok');
