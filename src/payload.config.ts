import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Clients } from './collections/Clients'
import { Media } from './collections/Media'
import { ProductLinks } from './collections/ProductLinks'
import { en } from '@payloadcms/translations/languages/en'
import { fa } from '@payloadcms/translations/languages/fa'
import { Categories } from './collections/Categories'
import { Brands } from './collections/Brands'
import { Settings } from './globals/config'
import { Changelog } from './globals/changelog/config'
import { Resources } from './globals/sites/config'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const iconUrl = 'http://localhost:3000/dark-ico.svg'
const darkIconUrl = 'http://localhost:3000/light-ico.svg'
const openGraphImageUrl = 'http://localhost:3000/opengraph.png'

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      graphics: {
        Logo: {
          path: '@/components/graphics/Logo.tsx#Logos',
          exportName: 'Logos',
        },
        Icon: {
          path: '@/components/graphics/Icon.tsx#Icons',
          exportName: 'Icons',
        },
      },
    },
    meta: {
      icons: [
        {
          fetchPriority: 'high',
          sizes: '32x32',
          type: 'image/png',
          rel: 'icon',
          url: iconUrl,
        },
        {
          fetchPriority: 'high',
          sizes: '32x32',
          type: 'image/png',
          rel: 'icon',
          url: darkIconUrl,
          media: '(prefers-color-scheme: dark)',
        },
      ],
      // title: 'Example',
      titleSuffix: ' - ارا',
      description: 'Ara Admin Panel',
      applicationName: 'Ara',
      openGraph: {
        title: 'Ara Admin Panel',
        description: 'Ara Admin Panel',
        siteName: 'Ara',
        images: [
          {
            url: openGraphImageUrl,
          },
        ],
      },
    },
  },
  i18n: {
    fallbackLanguage: 'fa',
    supportedLanguages: { en, fa }, // default
  },
  collections: [Users, Clients, Media, ProductLinks, Categories, Brands],
  globals: [Settings, Changelog, Resources],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [],
})
