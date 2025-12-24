import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: {
      en: 'Media',
      fa: 'رسانه',
    },
    plural: {
      en: 'Media',
      fa: 'رسـانه',
    },
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: {
        en: 'Alt',
        fa: 'توضیحات',
      },
      required: true,
    },
  ],
  upload: true,
}
