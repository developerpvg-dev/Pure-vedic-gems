import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { table } from '@sanity/table';
import { schemaTypes } from './schemaTypes';
import { withSlugHistory } from './slugHistory';

export default defineConfig({
  name: 'purevedicgems',
  title: 'PureVedicGems CMS',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'purevedicgems',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  basePath: '/studio',
  plugins: [structureTool(), table()],
  schema: {
    types: schemaTypes,
  },
  document: {
    actions: (prev, ctx) =>
      ctx.schemaType === 'blogPost'
        ? prev.map((action) => (action.action === 'publish' ? withSlugHistory(action) : action))
        : prev,
  },
});
