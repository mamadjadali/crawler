import type { CollectionConfig } from 'payload'

export const Clients: CollectionConfig = {
  slug: 'clients',
  labels: {
    singular: {
      en: 'Client',
      fa: 'کاربر',
    },
    plural: {
      en: 'Clients',
      fa: 'کاربرانــ',
    },
  },
  admin: {
    useAsTitle: 'username',
  },
  auth: {
    loginWithUsername: {
      requireEmail: true,
    },
  },
  fields: [
    {
      name: 'fullname',
      type: 'text',
      label: {
        en: 'Full Name',
        fa: 'نام کامل',
      },
    },
    {
      name: 'visibleCategories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: {
        en: 'Visible Categories',
        fa: 'دسته‌بندی‌های قابل نمایش',
      },
    },
    {
      name: 'role',
      label: {
        en: 'role',
        fa: 'رول',
      },
      required: true,
      defaultValue: 'pawn',
      type: 'select',
      options: [
        {
          label: 'God',
          value: 'god',
        },
        {
          label: 'King',
          value: 'king',
        },
        {
          label: 'Queen',
          value: 'queen',
        },
        {
          label: 'Rook',
          value: 'rook',
        },
        {
          label: 'Bishop',
          value: 'bishop',
        },
        {
          label: 'Knight',
          value: 'knight',
        },
        {
          label: 'Pawn',
          value: 'pawn',
        },
      ],
    },
  ],
}
