import { detectSiteFromUrl } from '@/domain/product/site'
import { ProductLink } from '@/payload-types'
import type { CollectionConfig } from 'payload'

type ProductUrlEntry = ProductLink['productUrls'][number]
function computeAggregates(productUrls: ProductUrlEntry[]) {
  const prices = productUrls.map((u) => u.currentPrice).filter((p) => p != null)

  const dates = productUrls
    .map((u) => u.lastCrawledAt)
    .filter(Boolean)
    .map((d) => new Date(d!).getTime())

  const hasSuccess = productUrls.some((u) => u.crawlStatus === 'success')
  const hasFailed = productUrls.some((u) => u.crawlStatus === 'failed')

  return {
    lowestPrice: prices.length ? Math.min(...prices) : null,
    lastCrawledAt: dates.length ? new Date(Math.max(...dates)).toISOString() : null,
    crawlStatus: hasSuccess ? 'success' : hasFailed ? 'failed' : 'pending',
  } as const
}

const MAX_PRICE_HISTORY = 10
export const ProductLinks: CollectionConfig = {
  slug: 'product-links',
  labels: {
    singular: {
      en: 'Product',
      fa: 'محصول',
    },
    plural: {
      en: 'Product',
      fa: 'محصولاتــ',
    },
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'productImage', 'productUrls', 'lastCrawledAt', 'crawlStatus'],
  },
  fields: [
    {
      name: 'name',
      label: {
        en: 'Name',
        fa: 'نام',
      },
      type: 'text',
      required: true,
      admin: {
        position: 'sidebar',
        description: {
          en: 'Product name',
          fa: 'نام محصول',
        },
      },
    },
    {
      name: 'productId',
      label: {
        en: 'Product ID',
        fa: 'شناسه محصول',
      },
      type: 'text',
      admin: {
        position: 'sidebar',
        description: {
          en: 'Product ID from the source site (e.g., Mobile140 product ID)',
          fa: 'شناسه محصول از سایت منبع (مثلا شناسه محصول در موبایل۱۴۰)',
        },
      },
    },
    {
      name: 'productImage',
      label: {
        en: 'Product Image',
        fa: 'تصویر محصول',
      },
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        description: {
          en: 'Product image',
          fa: 'تصویر محصول',
        },
      },
    },
    {
      name: 'category',
      label: {
        en: 'Category',
        fa: 'دسته بندی',
      },
      type: 'relationship',
      relationTo: 'categories',
      required: false,
      admin: {
        position: 'sidebar',
        description: {
          en: 'Select a category for this product',
          fa: 'دسته بندی محصول را انتخاب کنید',
        },
      },
    },
    {
      name: 'brand',
      label: {
        en: 'Brand',
        fa: 'برند',
      },
      type: 'relationship',
      relationTo: 'brands',
      required: false,
      admin: {
        position: 'sidebar',
        description: {
          en: 'Select a brand for this product',
          fa: 'برند محصول را انتخاب کنید',
        },
      },
    },
    {
      name: 'usd',
      label: {
        en: 'Usd Price',
        fa: 'قیمت دلاری محصول',
      },
      type: 'number',
      required: false,
      admin: {
        width: '50%',
        position: 'sidebar',
        description: {
          en: 'usd price for this product',
          fa: 'قیمت دلاری محصول برای محاسبه قیمت تمام شده',
        },
      },
    },
    {
      name: 'aed',
      label: {
        en: 'aed Price',
        fa: 'قیمت درهمی محصول',
      },
      type: 'number',
      required: false,
      admin: {
        width: '50px',
        position: 'sidebar',
        description: {
          en: 'aed price for this product',
          fa: 'قیمت درهمی محصول برای محاسبه قیمت تمام شده',
        },
      },
    },
    {
      name: 'disable',
      label: {
        en: 'Disable',
        fa: 'غیر‌فعال',
      },
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: {
          en: 'Disable the Product From Crawl and Display',
          fa: 'غیر فعال کردن محصول برای کرال و نمایش',
        },
      },
    },
    {
      name: 'basket',
      label: {
        en: 'Basket',
        fa: 'سبد',
      },
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: {
          en: 'َAdd Product to Provide list',
          fa: 'اضافه کردن محصول به سبد تامیین',
        },
      },
    },
    {
      name: 'productUrls',
      label: {
        en: 'Product URLs',
        fa: 'لینک‌های محصول',
      },
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        initCollapsed: true,
        description: {
          en: 'Product URLs to crawl (can add multiple URLs from different sites)',
          fa: 'لینک‌های محصول برای دریافت (می‌توانید چندین لینک برای محصولات متفاوت اضافه کنید)',
        },
      },
      fields: [
        {
          name: 'url',
          label: {
            en: 'URL',
            fa: 'آدرس',
          },
          type: 'text',
          required: true,
          admin: {
            description: {
              en: 'Product URL to crawl',
              fa: 'لینک صفحه محصول برای دریافت',
            },
          },
        },
        {
          name: 'site',
          label: {
            en: 'Site',
            fa: 'سایت',
          },
          type: 'select',
          required: true,
          defaultValue: 'torob',
          options: [
            { label: { en: 'Torob', fa: 'ترب' }, value: 'torob' },
            { label: { en: 'Technolife', fa: 'تکنولایف' }, value: 'technolife' },
            { label: { en: 'Mobile140', fa: 'موبایل۱۴۰' }, value: 'mobile140' },
            { label: { en: 'GooshiOnline', fa: 'گوشی آنلاین' }, value: 'gooshionline' },
            { label: { en: 'KasraPars', fa: 'کسراپارس' }, value: 'kasrapars' },
            { label: { en: 'Farnaa', fa: 'فرنا' }, value: 'farnaa' },
            { label: { en: 'Zitro', fa: 'زیــترو' }, value: 'zitro' },
            { label: { en: 'Yaran', fa: 'یـاران' }, value: 'yaran' },
            { label: { en: 'Green Lion', fa: 'گرین لاین' }, value: 'greenlion' },
            { label: { en: 'Plaza Digital', fa: 'پـلازا دیجیتال' }, value: 'plazadigital' },
            { label: { en: 'It Home', fa: 'آی تی هوم' }, value: 'ithome' },
            { label: { en: 'Zangooleh', fa: 'زنــگوله' }, value: 'zangooleh' },
            { label: { en: 'Farako', fa: 'فـراکـو' }, value: 'farako' },
            { label: { en: 'Xiaomi360', fa: 'شیـائـومی 360' }, value: 'xiaomi360' },
            { label: { en: 'Positron', fa: 'پوزیترون' }, value: 'positron' },
            { label: { en: 'Empratour', fa: 'امپراطور' }, value: 'empratour' },
            { label: { en: 'Royal part', fa: 'رویال پارت' }, value: 'royalpart' },
            { label: { en: 'Parhan tech', fa: 'پرهان تکـ' }, value: 'parhantech' },
            { label: { en: 'Mobo Part', fa: 'موبو پارت' }, value: 'mobopart' },
            { label: { en: 'Item Sara', fa: 'آیتم سرا' }, value: 'itemsara' },
            { label: { en: 'Kavosh Team', fa: 'کاوش تیم' }, value: 'kavoshteam' },
          ],
          admin: {
            description: {
              en: 'Site will be auto-detected from URL if not provided',
              fa: 'سایت به طور خودکار تشخیص داده می‌شود اگر نهایتا توسط کاربر انتخاب نشود',
            },
          },
        },
        {
          name: 'currentPrice',
          label: {
            en: 'Current Price',
            fa: 'قیمت فعلی',
          },
          type: 'number',
          admin: {
            description: {
              en: 'Latest crawled price from this URL',
              fa: 'قیمت آخرین دریافت از این لینک',
            },
            readOnly: true,
            hidden: true,
          },
        },
        {
          name: 'lastCrawledAt',
          label: {
            en: 'Last Crawled At',
            fa: 'زمان آخرین دریافت',
          },
          type: 'date',
          admin: {
            description: {
              en: 'Timestamp of last successful crawl for this URL',
              fa: 'زمان آخرین دریافت موفق از این لینک',
            },
            readOnly: true,
            hidden: true,
          },
        },
        {
          name: 'crawlStatus',
          label: {
            en: 'Crawl Status',
            fa: 'وضعیت دریافت',
          },
          type: 'select',
          options: [
            { label: { en: 'Pending', fa: 'درحال انتظار' }, value: 'pending' },
            { label: { en: 'Success', fa: 'موفق' }, value: 'success' },
            { label: { en: 'Failed', fa: 'خطا' }, value: 'failed' },
          ],
          defaultValue: 'pending',
          admin: {
            readOnly: true,
            hidden: true,
          },
        },
        {
          name: 'crawlError',
          label: {
            en: 'Crawl Error',
            fa: 'خطا در دریافت',
          },
          type: 'text',
          admin: {
            description: {
              en: 'Error message if crawl failed for this URL',
              fa: 'پیغام خطا اگر دریافت موفق نبود',
            },
            readOnly: true,
            hidden: true,
          },
        },
        {
          name: 'priceHistory',
          label: {
            en: 'Price History',
            fa: 'تاریخچه قیمت',
          },
          type: 'array',
          admin: {
            initCollapsed: true,
            description: {
              en: 'Historical price data for this URL',
              fa: 'تاریخچه قیمت برای این لینک',
            },
          },
          fields: [
            {
              name: 'price',
              label: {
                en: 'Price',
                fa: 'قیمت',
              },
              type: 'number',
              required: true,
            },
            {
              name: 'crawledAt',
              label: {
                en: 'Crawled At',
                fa: 'زمان دریافت',
              },
              type: 'date',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'lowestPrice',
      type: 'number',
      admin: { readOnly: true, hidden: true },
    },
    {
      name: 'lastCrawledAt',
      type: 'date',
      admin: { readOnly: true, hidden: true },
    },
    {
      name: 'crawlStatus',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
      ],
      admin: { readOnly: true, hidden: true },
    },
    {
      name: 'refreshButton',
      label: {
        en: 'Refresh Button',
        fa: 'دکمه به روز رسانی',
      },
      type: 'ui',
      admin: {
        components: {
          Field: '/components/RefreshPriceButton',
        },
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // Migrate old single URL to productUrls array
        if (data.url && !data.productUrls) {
          data.productUrls = [
            {
              url: data.url,
              site: data.site || detectSiteFromUrl(data.url),
              currentPrice: data.currentPrice || null,
              lastCrawledAt: data.lastCrawledAt || null,
              crawlStatus: data.crawlStatus || 'pending',
              crawlError: data.crawlError || null,
              priceHistory: data.priceHistory || [],
            },
          ]
        }

        // Ensure site detection and priceHistory trimming for each entry
        if (Array.isArray(data.productUrls)) {
          data.productUrls = data.productUrls.map((urlEntry) => {
            if (!urlEntry.site && urlEntry.url) {
              urlEntry.site = detectSiteFromUrl(urlEntry.url)
            }

            // Validate URL format
            if (urlEntry.url) {
              try {
                new URL(urlEntry.url)
              } catch {
                throw new Error(`Invalid URL format: ${urlEntry.url}`)
              }
            }

            // Trim price history
            if (Array.isArray(urlEntry.priceHistory)) {
              urlEntry.priceHistory = urlEntry.priceHistory.slice(-MAX_PRICE_HISTORY)
            }

            return urlEntry
          })
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        if (doc.disable) return doc
        if (req.context?.skipCrawl) return doc

        const shouldCrawl =
          operation === 'create' ||
          (operation === 'update' &&
            JSON.stringify(doc.productUrls) !== JSON.stringify(previousDoc?.productUrls))

        if (!shouldCrawl || !Array.isArray(doc.productUrls)) return doc

        try {
          const { crawlProduct } = await import('../lib/crawler/crawler')

          const updatedProductUrls: ProductUrlEntry[] = await Promise.all(
            doc.productUrls.map(async (urlEntry: ProductUrlEntry) => {
              if (!urlEntry.url) return urlEntry

              try {
                const result = await crawlProduct(urlEntry.url, urlEntry.site || 'torob')

                if (result.success && result.price != null) {
                  return {
                    ...urlEntry,
                    currentPrice: result.price,
                    lastCrawledAt: new Date().toISOString(),
                    crawlStatus: 'success',
                    crawlError: null,
                    priceHistory: [
                      ...(urlEntry.priceHistory || []),
                      { price: result.price, crawledAt: new Date().toISOString() },
                    ].slice(-MAX_PRICE_HISTORY),
                  }
                } else {
                  return {
                    ...urlEntry,
                    crawlStatus: 'failed',
                    crawlError: result.error || 'Unknown error',
                  }
                }
              } catch (err) {
                return {
                  ...urlEntry,
                  crawlStatus: 'failed',
                  crawlError: err instanceof Error ? err.message : 'Unknown error',
                }
              }
            }),
          )

          const aggregates = computeAggregates(updatedProductUrls)

          await req.payload.update({
            collection: 'product-links',
            id: doc.id,
            data: {
              productUrls: updatedProductUrls,
              ...aggregates,
            },
            context: { skipCrawl: true },
            req,
          })
        } catch (err) {
          console.error('Error updating product URLs after crawl:', err)
        }

        return doc
      },
    ],
  },
}
