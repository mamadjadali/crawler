import { GlobalConfig } from 'payload'

export const Changelog: GlobalConfig = {
  slug: 'changelog',
  label: {
    en: 'Change Log',
    fa: 'تغییراتـــ',
  },
  fields: [
    {
      name: 'log',
      label: {
        en: 'Log',
        fa: 'تغییراتــ',
      },
      type: 'array',
      required: false,
      minRows: 1,
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'title',
          label: {
            en: 'Title',
            fa: 'عنوانـ',
          },
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          label: {
            en: 'Description',
            fa: 'توضـیحاتــ',
          },
          type: 'textarea',
        },
      ],
    },
  ],
}
