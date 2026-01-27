import { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: {
      en: 'Category',
      fa: 'دستــبندی',
    },
    plural: {
      en: 'Categories',
      fa: 'دستــبندی‌ها',
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
