import { defineField, defineType } from 'sanity';
import { imageWithAlt, richTextBlocks, seoFields } from './shared';

export const servicePage = defineType({
  name: 'servicePage',
  title: 'Service Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (rule) => rule.required() }),
    defineField({ name: 'category', title: 'Category', type: 'string' }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3 }),
    defineField({ name: 'image', title: 'Image', ...imageWithAlt }),
    defineField({ name: 'body', title: 'Body', type: 'array', of: richTextBlocks }),
    defineField({ name: 'startingPrice', title: 'Starting Price', type: 'number' }),
    defineField({ name: 'duration', title: 'Duration', type: 'string' }),
    defineField({ name: 'isActive', title: 'Active', type: 'boolean', initialValue: true }),
    defineField({ name: 'sortOrder', title: 'Sort Order', type: 'number', initialValue: 0 }),
    ...seoFields,
  ],
});