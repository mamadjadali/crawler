import type { CollectionConfig } from 'payload'

export const ProductLinks: CollectionConfig = {
  slug: 'product-links',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'productImage', 'productUrls', 'lastCrawledAt', 'crawlStatus'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Product name',
      },
    },
    {
      name: 'productId',
      type: 'text',
      admin: {
        description: 'Product ID from the source site (e.g., Mobile140 product ID)',
      },
    },
    {
      name: 'productImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Product image',
      },
    },
    {
      name: 'productUrls',
      type: 'array',
      required: true,
      minRows: 1,
      admin: {
        description: 'Product URLs to crawl (can add multiple URLs from different sites)',
      },
      fields: [
        {
          name: 'url',
          type: 'text',
          required: true,
          admin: {
            description: 'Product URL to crawl',
          },
        },
        {
          name: 'site',
          type: 'select',
          options: [
            { label: 'Torob', value: 'torob' },
            { label: 'Technolife', value: 'technolife' },
            { label: 'Mobile140', value: 'mobile140' },
            { label: 'GooshiOnline', value: 'gooshionline' },
            { label: 'KasraPars', value: 'kasrapars' },
          ],
          admin: {
            description: 'Site will be auto-detected from URL if not provided',
          },
        },
        {
          name: 'currentPrice',
          type: 'number',
          admin: {
            description: 'Latest crawled price from this URL',
            readOnly: true,
          },
        },
        {
          name: 'lastCrawledAt',
          type: 'date',
          admin: {
            description: 'Timestamp of last successful crawl for this URL',
            readOnly: true,
          },
        },
        {
          name: 'crawlStatus',
          type: 'select',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Success', value: 'success' },
            { label: 'Failed', value: 'failed' },
          ],
          defaultValue: 'pending',
          admin: {
            readOnly: true,
          },
        },
        {
          name: 'crawlError',
          type: 'text',
          admin: {
            description: 'Error message if crawl failed for this URL',
            readOnly: true,
          },
        },
        {
          name: 'priceHistory',
          type: 'array',
          admin: {
            description: 'Historical price data for this URL',
          },
          fields: [
            {
              name: 'price',
              type: 'number',
              required: true,
            },
            {
              name: 'crawledAt',
              type: 'date',
              required: true,
            },
          ],
        },
      ],
    },
    {
      name: 'refreshButton',
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
          let detectedSite: 'torob' | 'technolife' | 'mobile140' | 'gooshionline' | 'kasrapars' = 'torob'
          
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
                } else if (hostname.includes('kasrapars.ir') || hostname.includes('plus.kasrapars.ir')) {
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
              })
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

