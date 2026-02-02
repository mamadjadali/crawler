import { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: {
    en: 'Settings',
    fa: 'تنظیماتــ',
  },
  fields: [
    {
      name: 'usdprice',
      type: 'number',
      label: {
        en: 'USD Price',
        fa: 'قیمت دلار',
      },
    },
    {
      name: 'importFee',
      type: 'number',
      label: {
        en: 'Import Fee',
        fa: 'هزینه واردات',
      },
    },
  ],
}
