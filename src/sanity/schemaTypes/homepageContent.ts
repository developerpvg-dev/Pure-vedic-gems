import { defineArrayMember, defineField, defineType } from 'sanity';

export const homepageContent = defineType({
  name: 'homepageContent',
  title: 'Homepage Content',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Internal Title', type: 'string', initialValue: 'Homepage' }),
    defineField({ name: 'knowledgeHeading', title: 'Knowledge Heading', type: 'string' }),
    defineField({ name: 'knowledgeSubheading', title: 'Knowledge Subheading', type: 'text', rows: 2 }),
    defineField({ name: 'featuredKnowledge', title: 'Featured Knowledge Articles', type: 'array', of: [defineArrayMember({ type: 'reference', to: [{ type: 'knowledgeArticle' }] })] }),
    defineField({ name: 'featuredTestimonials', title: 'Featured Testimonials', type: 'array', of: [defineArrayMember({ type: 'reference', to: [{ type: 'testimonial' }] })] }),
    defineField({ name: 'updatedAt', title: 'Updated At', type: 'datetime' }),
  ],
});