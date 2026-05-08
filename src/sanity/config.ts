import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemaTypes';

export default defineConfig({
  name: 'purevedicgems',
  title: 'PureVedicGems CMS',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'purevedicgems',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  basePath: '/studio',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});