import { defineArrayMember, defineField, defineType } from 'sanity';
import { imageWithAlt, seoFields } from './shared';

export const storeLocation = defineType({
  name: 'storeLocation',
  title: 'Store Location',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Store Name', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (rule) => rule.required() }),
    defineField({ name: 'image', title: 'Store Image', ...imageWithAlt }),
    defineField({ name: 'addressLine1', title: 'Address Line 1', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'addressLine2', title: 'Address Line 2', type: 'string' }),
    defineField({ name: 'city', title: 'City', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'region', title: 'State/Region', type: 'string' }),
    defineField({ name: 'postalCode', title: 'Postal Code', type: 'string' }),
    defineField({ name: 'country', title: 'Country', type: 'string', initialValue: 'India' }),
    defineField({ name: 'phone', title: 'Phone', type: 'string' }),
    defineField({ name: 'email', title: 'Email', type: 'email' }),
    defineField({ name: 'mapUrl', title: 'Google Maps URL', type: 'url' }),
    defineField({
      name: 'hours',
      title: 'Opening Hours',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'day', title: 'Day', type: 'string' }),
            defineField({ name: 'time', title: 'Time', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({ name: 'isPrimary', title: 'Primary Store', type: 'boolean', initialValue: false }),
    defineField({ name: 'isActive', title: 'Active', type: 'boolean', initialValue: true }),
    defineField({ name: 'sortOrder', title: 'Sort Order', type: 'number', initialValue: 0 }),
    ...seoFields,
  ],
});