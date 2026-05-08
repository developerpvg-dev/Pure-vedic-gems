import { defineField, defineType } from 'sanity';
import { imageWithAlt } from './shared';

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' } }),
    defineField({ name: 'image', title: 'Photo', ...imageWithAlt }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'bio', title: 'Bio', type: 'text', rows: 4 }),
    defineField({ name: 'credentials', title: 'Credentials', type: 'array', of: [{ type: 'string' }] }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'title', media: 'image' },
  },
});