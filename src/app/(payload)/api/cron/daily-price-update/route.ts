import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { crawlProduct } from '../../../../../lib/crawler/crawler'

// This endpoint can be called by a cron service (e.g., Vercel Cron, external cron)
// Or you can set up a Next.js cron job if using Next.js 13+ with app router
export async function GET(request: Request) {
  // Optional: Add authentication/authorization check
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const payload = await getPayload({ config: configPromise })

    // Find all product links
    const { docs: products } = await payload.find({
      collection: 'product-links',
      limit: 1000, // Adjust as needed
      depth: 0,
    })

    const results = {
      total: products.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Crawl each product with a delay to avoid rate limiting
    for (const product of products) {
      if (!product.productUrls || !Array.isArray(product.productUrls) || product.productUrls.length === 0) {
        results.failed++
        results.errors.push(`Product ${product.id}: No URLs`)
        continue
      }

      try {
        // Crawl all URLs for this product
        const updatedProductUrls = await Promise.all(
          product.productUrls.map(async (urlEntry: any) => {
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

        // Update the product with all URL crawl results
        await payload.update({
          collection: 'product-links',
          id: product.id,
          data: {
            productUrls: updatedProductUrls,
          },
        })

        // Count successes and failures
        const urlSuccesses = updatedProductUrls.filter((url: any) => url.crawlStatus === 'success').length
        const urlFailures = updatedProductUrls.filter((url: any) => url.crawlStatus === 'failed').length

        if (urlSuccesses > 0) {
          results.success++
        }
        if (urlFailures > 0) {
          results.failed++
          results.errors.push(`Product ${product.id}: ${urlFailures} URL(s) failed`)
        }

        // Add delay between products to avoid rate limiting (2 seconds)
        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        results.failed++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Product ${product.id}: ${errorMessage}`)
      }
    }

    return Response.json({
      success: true,
      message: 'Daily price update completed',
      results,
    })
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

