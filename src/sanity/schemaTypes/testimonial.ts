import { defineField, defineType } from 'sanity';

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Customer Name', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'location', title: 'Location', type: 'string' }),
    defineField({ name: 'rating', title: 'Rating', type: 'number', initialValue: 5, validation: (rule) => rule.min(1).max(5) }),
    defineField({ name: 'quote', title: 'Quote', type: 'text', rows: 5, validation: (rule) => rule.required().max(700) }),
    defineField({ name: 'productContext', title: 'Product Context', type: 'string' }),
    defineField({ name: 'isFeatured', title: 'Featured', type: 'boolean', initialValue: false }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime' }),
  ],
});