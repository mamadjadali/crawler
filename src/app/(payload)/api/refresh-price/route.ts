import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { crawlProduct } from '../../../../lib/crawler/crawler'
import pLimit from 'p-limit'
import type { ProductLink } from '@/payload-types'

type ProductUrlEntry = ProductLink['productUrls'][number]

function computeAggregates(productUrls: ProductUrlEntry[]) {
  const prices = productUrls.map((u) => u.currentPrice).filter((p) => p != null)
  const dates = productUrls
    .map((u) => u.lastCrawledAt)
    .filter(Boolean)
    .map((d) => new Date(d!).getTime())
  const hasSuccess = productUrls.some((u) => u.crawlStatus === 'success')
  const hasFailed = productUrls.some((u) => u.crawlStatus === 'failed')

  // Explicitly cast crawlStatus to the allowed union
  const crawlStatus: 'pending' | 'success' | 'failed' = hasSuccess
    ? 'success'
    : hasFailed
      ? 'failed'
      : 'pending'

  return {
    lowestPrice: prices.length ? Math.min(...prices) : null,
    lastCrawledAt: dates.length ? new Date(Math.max(...dates)).toISOString() : null,
    crawlStatus: crawlStatus as 'pending' | 'success' | 'failed',
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await request.json()
    const { id } = body

    if (!id) return Response.json({ error: 'Product ID is required' }, { status: 400 })

    const product = await payload.findByID({ collection: 'product-links', id, depth: 0 })
    if (!product) return Response.json({ error: 'Product not found' }, { status: 404 })
    if (
      !product.productUrls ||
      !Array.isArray(product.productUrls) ||
      product.productUrls.length === 0
    ) {
      return Response.json({ error: 'Product URLs are missing' }, { status: 400 })
    }

    const urlLimit = pLimit(5)

    const updatedProductUrls: ProductUrlEntry[] = (await Promise.all(
      product.productUrls.map((urlEntry: ProductUrlEntry) =>
        urlLimit(async () => {
          if (!urlEntry.url) return urlEntry

          const urlStartTime = Date.now()
          try {
            const result = await crawlProduct(urlEntry.url, urlEntry.site || 'torob')
            const urlEndTime = Date.now()
            const urlDuration = ((urlEndTime - urlStartTime) / 1000).toFixed(2)

            if (result.success && result.price != null) {
              console.log(
                `[Crawl] ${urlEntry.site || 'torob'} - ${urlEntry.url.substring(0, 50)}... | Time: ${urlDuration}s | ✓ Success | Price: ${result.price?.toLocaleString('fa-IR')}`,
              )
              return {
                ...urlEntry,
                currentPrice: result.price,
                lastCrawledAt: new Date().toISOString(),
                crawlStatus: (result.success ? 'success' : 'failed') as
                  | 'pending'
                  | 'success'
                  | 'failed', // ✅ explicitly typed,
                crawlError: result.success ? null : result.error || 'Unknown error',
                priceHistory: [
                  ...(urlEntry.priceHistory || []),
                  { price: result.price, crawledAt: new Date().toISOString() },
                ].slice(-10),
              }
            } else {
              console.log(
                `[Crawl] ${urlEntry.site || 'torob'} - ${urlEntry.url.substring(0, 50)}... | Time: ${urlDuration}s | ✗ Failed | Error: ${result.error || 'Unknown'}`,
              )
              return {
                ...urlEntry,
                crawlStatus: 'failed',
                crawlError: result.error || 'Unknown error',
              }
            }
          } catch (error) {
            const urlEndTime = Date.now()
            const urlDuration = ((urlEndTime - urlStartTime) / 1000).toFixed(2)
            console.log(
              `[Crawl] ${urlEntry.site || 'torob'} - ${urlEntry.url.substring(0, 50)}... | Time: ${urlDuration}s | ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            )
            return {
              ...urlEntry,
              crawlStatus: 'failed',
              crawlError: error instanceof Error ? error.message : 'Unknown error',
            }
          }
        }),
      ),
    )) as ProductUrlEntry[]

    // Compute aggregates after crawling
    const aggregates = computeAggregates(updatedProductUrls)

    const updated = await payload.update({
      collection: 'product-links',
      id,
      data: {
        productUrls: updatedProductUrls,
        ...aggregates,
      },
      depth: 0,
    })

    return Response.json({
      success: true,
      productUrls: updatedProductUrls,
      product: {
        id: updated.id,
        name: updated.name,
        updatedAt: updated.updatedAt,
      },
    })
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 },
    )
  }
}

// import { getPayload } from 'payload'
// import configPromise from '@payload-config'
// import { crawlProduct } from '../../../../lib/crawler/crawler'
// import pLimit from 'p-limit'

// export async function POST(request: Request) {
//   try {
//     const payload = await getPayload({ config: configPromise })

//     // Get the request with authentication
//     const authHeader = request.headers.get('authorization')
//     const cookies = request.headers.get('cookie')

//     // Create a mock request object for Payload authentication
//     // In a real scenario, we'd need to properly authenticate
//     // For now, we'll check if user is authenticated via cookies

//     const body = await request.json()
//     const { id } = body

//     if (!id) {
//       return Response.json({ error: 'Product ID is required' }, { status: 400 })
//     }

//     // Get the product link
//     const product = await payload.findByID({
//       collection: 'product-links',
//       id,
//       depth: 0,
//     })

//     if (!product) {
//       return Response.json({ error: 'Product not found' }, { status: 404 })
//     }

//     if (!product.productUrls || !Array.isArray(product.productUrls) || product.productUrls.length === 0) {
//       return Response.json({ error: 'Product URLs are missing' }, { status: 400 })
//     }

//     // Crawl all URLs for the product with concurrency control
//     const urlLimit = pLimit(5) // Process 5 URLs concurrently per product
//     const crawlStartTime = Date.now()

//     const urlPromises = product.productUrls.map((urlEntry: any) =>
//       urlLimit(async () => {
//         // Skip if URL is empty
//         if (!urlEntry.url) {
//           return urlEntry
//         }

//         const urlStartTime = Date.now()
//         try {
//           const result = await crawlProduct(urlEntry.url, urlEntry.site || 'torob')
//           const urlEndTime = Date.now()
//           const urlDuration = ((urlEndTime - urlStartTime) / 1000).toFixed(2)
//           if (result.success) {
//             console.log(`[Crawl] ${urlEntry.site || 'torob'} - ${urlEntry.url.substring(0, 50)}... | Time: ${urlDuration}s | ✓ Success | Price: ${result.price?.toLocaleString('fa-IR')}`)
//           } else {
//             console.log(`[Crawl] ${urlEntry.site || 'torob'} - ${urlEntry.url.substring(0, 50)}... | Time: ${urlDuration}s | ✗ Failed | Error: ${result.error || 'Unknown'}`)
//           }

//           if (result.success && result.price !== null) {
//             return {
//               ...urlEntry,
//               currentPrice: result.price,
//               lastCrawledAt: new Date().toISOString(),
//               crawlStatus: 'success',
//               crawlError: null,
//               priceHistory: [
//                 ...(urlEntry.priceHistory || []),
//                 {
//                   price: result.price,
//                   crawledAt: new Date().toISOString(),
//                 },
//               ],
//             }
//           } else {
//             return {
//               ...urlEntry,
//               crawlStatus: 'failed',
//               crawlError: result.error || 'Unknown error',
//             }
//           }
//         } catch (error) {
//           const urlEndTime = Date.now()
//           const urlDuration = ((urlEndTime - urlStartTime) / 1000).toFixed(2)
//           console.log(`[Crawl] ${urlEntry.site || 'torob'} - ${urlEntry.url.substring(0, 50)}... | Time: ${urlDuration}s | ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
//           return {
//             ...urlEntry,
//             crawlStatus: 'failed',
//             crawlError: error instanceof Error ? error.message : 'Unknown error',
//           }
//         }
//       })
//     )

//     const settledResults = await Promise.allSettled(urlPromises)
//     const crawlEndTime = Date.now()
//     const totalDuration = ((crawlEndTime - crawlStartTime) / 1000).toFixed(2)
//     console.log(`[Crawl] Product ${product.id} - Total crawl time: ${totalDuration}s for ${product.productUrls.length} URL(s)`)

//     const mapStartTime = Date.now()
//     const updatedProductUrls = settledResults.map((result) => {
//       if (result.status === 'fulfilled') {
//         return result.value
//       } else {
//         // If a promise was rejected, return a failed URL entry
//         // Find the corresponding URL entry to preserve its structure
//         const index = settledResults.indexOf(result)
//         const urlEntry = product.productUrls[index]
//         return {
//           ...urlEntry,
//           crawlStatus: 'failed',
//           crawlError: result.reason instanceof Error ? result.reason.message : 'Unknown error',
//         }
//       }
//     })
//     const mapEndTime = Date.now()
//     const mapDuration = ((mapEndTime - mapStartTime) / 1000).toFixed(2)
//     console.log(`[Crawl] Product ${product.id} - Result mapping time: ${mapDuration}s`)

//     // Update the product with all URL crawl results
//     const dbUpdateStartTime = Date.now()
//     const updated = await payload.update({
//       collection: 'product-links',
//       id,
//       data: {
//         productUrls: updatedProductUrls,
//       },
//       depth: 0, // Don't populate relationships - faster
//     })
//     const dbUpdateEndTime = Date.now()
//     const dbUpdateDuration = ((dbUpdateEndTime - dbUpdateStartTime) / 1000).toFixed(2)
//     console.log(`[Crawl] Product ${product.id} - Database update time: ${dbUpdateDuration}s`)

//     // Return minimal data for frontend state update (reduced payload size)
//     const responseStartTime = Date.now()
//     const response = Response.json({
//       success: true,
//       productUrls: updatedProductUrls,
//       // Only return essential fields to reduce response size
//       product: {
//         id: updated.id,
//         name: updated.name,
//         updatedAt: updated.updatedAt,
//       },
//     })
//     const responseEndTime = Date.now()
//     const responseDuration = ((responseEndTime - responseStartTime) / 1000).toFixed(2)
//     const totalApiTime = ((responseEndTime - crawlStartTime) / 1000).toFixed(2)
//     console.log(`[Crawl] Product ${product.id} - Response serialization time: ${responseDuration}s | Total API time: ${totalApiTime}s`)

//     return response
//   } catch (error) {
//     return Response.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : 'Unknown error occurred',
//       },
//       { status: 500 }
//     )
//   }
// }
