import type { CollectionConfig } from 'payload'

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
        description: {
          en: 'Product image',
          fa: 'تصویر محصول',
        },
      },
    },
    {
      name: 'category',
      label: 'Category',
      type: 'relationship',
      relationTo: 'categories',
      required: false,
      admin: { description: 'Select a category for this product' },
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
          options: [
            { label: { en: 'Torob', fa: 'ترب' }, value: 'torob' },
            { label: { en: 'Technolife', fa: 'تکنولایف' }, value: 'technolife' },
            { label: { en: 'Mobile140', fa: 'موبایل۱۴۰' }, value: 'mobile140' },
            { label: { en: 'GooshiOnline', fa: 'گوشی آنلاین' }, value: 'gooshionline' },
            { label: { en: 'KasraPars', fa: 'کسراپارس' }, value: 'kasrapars' },
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
      async ({ data, operation, req }) => {
        // Handle migration: if old single url exists, convert to productUrls array
        if (data.url && !data.productUrls) {
          const url = new URL(data.url)
          const hostname = url.hostname.toLowerCase()
          let detectedSite: 'torob' | 'technolife' | 'mobile140' | 'gooshionline' | 'kasrapars' =
            'torob'

          if (hostname.includes('torob.com')) {
            detectedSite = 'torob'
          } else if (hostname.includes('technolife.com')) {
            detectedSite = 'technolife'
          } else if (hostname.includes('mobile140.com')) {
            detectedSite = 'mobile140'
          } else if (hostname.includes('gooshi.online')) {
            detectedSite = 'gooshionline'
          } else if (hostname.includes('kasrapars.ir') || hostname.includes('plus.kasrapars.ir')) {
            detectedSite = 'kasrapars'
          }

          data.productUrls = [
            {
              url: data.url,
              site: data.site || detectedSite,
              currentPrice: data.currentPrice || null,
              lastCrawledAt: data.lastCrawledAt || null,
              crawlStatus: data.crawlStatus || 'pending',
              crawlError: data.crawlError || null,
              priceHistory: data.priceHistory || [],
            },
          ]
        }

        // Auto-detect site for each URL in productUrls array
        if (data.productUrls && Array.isArray(data.productUrls)) {
          for (const urlEntry of data.productUrls) {
            if (urlEntry.url && !urlEntry.site) {
              try {
                const url = new URL(urlEntry.url)
                const hostname = url.hostname.toLowerCase()

                if (hostname.includes('torob.com')) {
                  urlEntry.site = 'torob'
                } else if (hostname.includes('technolife.com')) {
                  urlEntry.site = 'technolife'
                } else if (hostname.includes('mobile140.com')) {
                  urlEntry.site = 'mobile140'
                } else if (hostname.includes('gooshi.online')) {
                  urlEntry.site = 'gooshionline'
                } else if (
                  hostname.includes('kasrapars.ir') ||
                  hostname.includes('plus.kasrapars.ir')
                ) {
                  urlEntry.site = 'kasrapars'
                } else {
                  urlEntry.site = 'torob' // Default fallback
                }
              } catch {
                throw new Error(`Invalid URL format: ${urlEntry.url}`)
              }
            }

            // Validate URL format
            if (urlEntry.url) {
              try {
                new URL(urlEntry.url)
              } catch {
                throw new Error(`Invalid URL format: ${urlEntry.url}`)
              }
            }
          }
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        // Skip crawl if context flag is set (prevents infinite loops)
        if (req.context?.skipCrawl) {
          return doc
        }

        // Only crawl on create or when productUrls change
        const shouldCrawl =
          operation === 'create' ||
          (operation === 'update' &&
            JSON.stringify(doc.productUrls) !== JSON.stringify(previousDoc?.productUrls))

        if (shouldCrawl && doc.productUrls && Array.isArray(doc.productUrls)) {
          try {
            // Import crawler dynamically to avoid circular dependencies
            const { crawlProduct } = await import('../lib/crawler/crawler')

            // Crawl all URLs in the array
            const updatedProductUrls = await Promise.all(
              doc.productUrls.map(async (urlEntry: any) => {
                // Skip if URL is empty
                if (!urlEntry.url) {
                  return urlEntry
                }

                try {
                  const result = await crawlProduct(urlEntry.url, urlEntry.site || 'torob')

                  if (result.success && result.price !== null) {
                    return {
                      ...urlEntry,
                      currentPrice: result.price,
                      lastCrawledAt: new Date().toISOString(),
                      crawlStatus: 'success',
                      crawlError: null,
                      priceHistory: [
                        ...(urlEntry.priceHistory || []),
                        {
                          price: result.price,
                          crawledAt: new Date().toISOString(),
                        },
                      ],
                    }
                  } else {
                    return {
                      ...urlEntry,
                      crawlStatus: 'failed',
                      crawlError: result.error || 'Unknown error',
                    }
                  }
                } catch (error) {
                  return {
                    ...urlEntry,
                    crawlStatus: 'failed',
                    crawlError: error instanceof Error ? error.message : 'Unknown error',
                  }
                }
              }),
            )

            // Update the document with crawl results for all URLs
            await req.payload.update({
              collection: 'product-links',
              id: doc.id,
              data: {
                productUrls: updatedProductUrls,
              },
              context: { skipCrawl: true }, // Prevent infinite loop
              req,
            })
          } catch (error) {
            // If there's an error updating, log it but don't fail the operation
            console.error('Error updating product URLs after crawl:', error)
          }
        }

        return doc
      },
    ],
  },
}
