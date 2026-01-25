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
  ],
}
