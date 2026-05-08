import { defineField, defineType } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Internal Title', type: 'string', initialValue: 'Site Settings' }),
    defineField({ name: 'supportPhone', title: 'Support Phone', type: 'string' }),
    defineField({ name: 'supportEmail', title: 'Support Email', type: 'email' }),
    defineField({ name: 'whatsappNumber', title: 'WhatsApp Number', type: 'string' }),
    defineField({ name: 'consultationDisclaimer', title: 'Consultation Disclaimer', type: 'text', rows: 4 }),
    defineField({ name: 'gemstoneDisclaimer', title: 'Gemstone Disclaimer', type: 'text', rows: 4 }),
  ],
});