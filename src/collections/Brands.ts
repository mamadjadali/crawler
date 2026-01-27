import { CollectionConfig } from 'payload'

export const Brands: CollectionConfig = {
  slug: 'brands',
  labels: {
    singular: {
      en: 'Brand',
      fa: 'برنــد',
    },
    plural: {
      en: 'Brands',
      fa: 'بــرنــد‌ها',
    },
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true },
  ],
  admin: {
    useAsTitle: 'name',
  },
}
