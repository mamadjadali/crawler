import { GlobalConfig } from 'payload'

export const Resources: GlobalConfig = {
  slug: 'resources',
  label: {
    en: 'Resources',
    fa: 'منابعــ',
  },
  fields: [
    {
      name: 'site',
      label: {
        en: 'site',
        fa: 'سایتــ',
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
      ],
    },
  ],
}
