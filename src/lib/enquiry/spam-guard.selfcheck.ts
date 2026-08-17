import { looksLikeGibberishName } from './spam-guard';

const spamSamples = [
  'sigEDmuVihDovljCCfZXaRH',
  'WKwsHBHNAEshmFxFOBhy',
  'SayEPVgKlsGeoaGR',
];

const legitSamples = ['Rajesh Kumar', 'Priya', 'Ananya Sharma', 'John Smith', 'Aarav'];

for (const name of spamSamples) {
  if (!looksLikeGibberishName(name)) {
    throw new Error(`expected spam: ${name}`);
  }
}

for (const name of legitSamples) {
  if (looksLikeGibberishName(name)) {
    throw new Error(`expected legit: ${name}`);
  }
}

console.log('spam-guard.selfcheck ok');
