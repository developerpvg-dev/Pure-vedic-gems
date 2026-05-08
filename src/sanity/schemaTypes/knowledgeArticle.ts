import { defineArrayMember, defineField, defineType } from 'sanity';
import { imageWithAlt, richTextBlocks, seoFields } from './shared';

export const knowledgeArticle = defineType({
  name: 'knowledgeArticle',
  title: 'Knowledge Article',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (rule) => rule.required().max(120) }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (rule) => rule.required() }),
    defineField({ name: 'category', title: 'Category', type: 'string', options: { list: ['Gemstone Guide', 'Rudraksha', 'Vedic Astrology', 'Buying Safety', 'Care Guide'] }, validation: (rule) => rule.required() }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3, validation: (rule) => rule.max(240) }),
    defineField({ name: 'mainImage', title: 'Main Image', ...imageWithAlt }),
    defineField({ name: 'author', title: 'Author or Reviewer', type: 'reference', to: [{ type: 'author' }, { type: 'expertProfile' }] }),
    defineField({ name: 'body', title: 'Article Body', type: 'array', of: richTextBlocks }),
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
    defineField({ name: 'relatedProductCategoryHref', title: 'Related Product Category URL', type: 'string' }),
    defineField({ name: 'featured', title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime', initialValue: () => new Date().toISOString() }),
    defineField({ name: 'updatedAt', title: 'Updated At', type: 'datetime' }),
    ...seoFields,
  ],
  preview: {
    select: { title: 'title', subtitle: 'category', media: 'mainImage' },
  },
});