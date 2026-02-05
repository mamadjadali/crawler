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
    {
      name: 'name',
      label: {
        en: 'Name',
        fa: 'نام برند',
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
