import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Use import.meta.url so this always resolves to the project root,
// even when called from Turbopack's PostCSS runner with a different cwd.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const config = {
  plugins: {
    '@tailwindcss/postcss': {
      // base tells Tailwind v4 where to scan for source files.
      // Must be the project root (not src/app/) so all pages/components are scanned.
      base: projectRoot,
    },
  },
};

export default config;
