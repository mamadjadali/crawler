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
    {
      name: 'name',
      label: {
        en: 'Name',
        fa: 'نام دسته بندی',
      },
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: {
        en: 'Slug',
        fa: 'اسلاگ (به انگلیسی)',
      },
      type: 'text',
      required: true,
    },
  ],
  admin: {
    useAsTitle: 'name',
  },
}
