import { defineField, defineType } from 'sanity';
import { imageWithAlt } from './shared';

export const expertProfile = defineType({
  name: 'expertProfile',
  title: 'Expert Profile',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' } }),
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({ name: 'specialty', title: 'Specialty', type: 'string' }),
    defineField({ name: 'photo', title: 'Photo', ...imageWithAlt }),
    defineField({ name: 'bio', title: 'Bio', type: 'text', rows: 6 }),
    defineField({ name: 'personalQuote', title: 'Personal Quote', type: 'text', rows: 3 }),
    defineField({ name: 'credentials', title: 'Credentials', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'languages', title: 'Languages', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'yearsExperience', title: 'Years Experience', type: 'number' }),
    defineField({ name: 'sortOrder', title: 'Sort Order', type: 'number', initialValue: 0 }),
    defineField({ name: 'isActive', title: 'Active', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'specialty', media: 'photo' },
  },
});