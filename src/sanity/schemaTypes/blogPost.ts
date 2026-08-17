import { defineArrayMember, defineField, defineType } from 'sanity';
import { imageWithAlt, richTextBlocks, seoFields } from './shared';

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required().max(120) }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (rule) => rule.required() }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3, validation: (rule) => rule.max(220) }),
    defineField({ name: 'category', title: 'Category', type: 'reference', to: [{ type: 'blogCategory' }] }),
    defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'author' }] }),
    defineField({ name: 'mainImage', title: 'Main Image', ...imageWithAlt }),
    defineField({ name: 'body', title: 'Body', type: 'array', of: richTextBlocks }),
    defineField({
      name: 'faqs',
      title: 'FAQs',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'question', title: 'Question', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 3, validation: (rule) => rule.required() }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'relatedProductCategoryHref',
      title: 'Related Product Category URL',
      type: 'string',
      validation: (rule) => rule.custom((value) => !value || value.startsWith('/') || 'Use a relative site URL, e.g. /shop/emerald'),
    }),
    defineField({
      name: 'relatedProductCategoryLabel',
      title: 'Related Product Category Label',
      type: 'string',
      validation: (rule) => rule.max(80),
    }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime', initialValue: () => new Date().toISOString() }),
    ...seoFields,
  ],
  preview: {
    select: { title: 'title', subtitle: 'category.title', media: 'mainImage' },
  },
});