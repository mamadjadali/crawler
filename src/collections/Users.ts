import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: {
      en: 'Admin',
      fa: 'مدیر',
    },
    plural: {
      en: 'Admins',
      fa: 'مدیرانــ',
    },
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    // Email added by default
    // Add more fields as needed
  ],
}
