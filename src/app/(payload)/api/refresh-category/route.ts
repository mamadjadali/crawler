import { NextResponse } from 'next/server'
import pLimit from 'p-limit'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { crawlProduct } from '@/lib/crawler/crawler'

const PRODUCT_CONCURRENCY = 2 // increased a bit — most sites can handle 3 parallel requests
const URL_CONCURRENCY = 4 // most products have 2–5 URLs — 6 is safe
const MIN_REFRESH_INTERVAL_MS = 10 * 60 * 1000 // 10 min

// In-memory lock per category (prevents double refresh)
const runningCategories = new Set<string>()

export async function POST(req: Request) {
  let category: string | undefined

  try {
    const body = await req.json()
    category = body.category
    const { brand, limit = 50 } = body

    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 })
    }

    if (runningCategories.has(category)) {
      return NextResponse.json(
        { ok: false, message: 'Category is already being refreshed' },
        { status: 409 },
      )
    }

    runningCategories.add(category)

    const payload = await getPayload({ config })

    // Fetch only necessary fields + depth 0 (faster query)
    const { docs: products } = await payload.find({
      collection: 'product-links',
      where: {
        disable: { not_equals: true },
        category: { equals: category },
        ...(brand && { brand: { equals: brand } }),
      },
      limit,
      depth: 0,
      select: {
        id: true,
        productUrls: true,
        updatedAt: true,
        disable: true,
        name: true, // optional — useful for logs
      },
    })

    const productLimiter = pLimit(PRODUCT_CONCURRENCY)
    const urlLimiter = pLimit(URL_CONCURRENCY)

    let refreshed = 0
    let skipped = 0
    let failed = 0
    const logEntries: string[] = []

    const log = (msg: string) => {
      const time = new Date().toISOString()
      const entry = `[${time}] ${msg}`
      console.log(entry)
      logEntries.push(entry)
    }

    log(`Starting category refresh: ${category} (${products.length} products found)`)

    await Promise.all(
      products.map((product) =>
        productLimiter(async () => {
          const prodId = product.id
          const prodName = product.name || '(no name)'
          // Early skip checks
          if (product.disable === true) {
            skipped++
            log(`[SKIP - Disabled] ${prodId} - ${prodName}`)
            return
          }

          const now = Date.now()
          const lastUpdate = product.updatedAt ? new Date(product.updatedAt).getTime() : 0

          if (now - lastUpdate < MIN_REFRESH_INTERVAL_MS || !product.productUrls?.length) {
            skipped++
            log(
              `[SKIP - Recent] ${prodId} - ${prodName} (updated ${Math.round((now - lastUpdate) / 60000)} min ago)`,
            )
            return
          }

          log(`[START] Refreshing ${prodId} - ${prodName} (${product.productUrls.length} URLs)`)

          try {
            const updatedUrls = await Promise.all(
              product.productUrls.map((urlEntry: any) =>
                urlLimiter(async () => {
                  if (!urlEntry.url) return urlEntry

                  try {
                    const result = await crawlProduct(urlEntry.url, urlEntry.site || 'torob')

                    const newHistory = [...(urlEntry.priceHistory || [])]

                    if (result.success && result.price != null) {
                      newHistory.push({
                        price: result.price,
                        crawledAt: new Date().toISOString(),
                      })
                    }

                    return {
                      ...urlEntry,
                      currentPrice:
                        result.success && result.price != null
                          ? result.price
                          : urlEntry.currentPrice,
                      lastCrawledAt: new Date().toISOString(),
                      crawlStatus: result.success ? 'success' : 'failed',
                      crawlError: result.success ? null : result.error || 'Unknown error',
                      priceHistory: newHistory,
                    }
                  } catch (err) {
                    return {
                      ...urlEntry,
                      crawlStatus: 'failed',
                      crawlError: err instanceof Error ? err.message : 'Unknown error',
                    }
                  }
                }),
              ),
            )

            // Update only productUrls (faster than full doc update)
            await payload.update({
              collection: 'product-links',
              id: product.id,
              data: { productUrls: updatedUrls },
              depth: 0,
            })

            refreshed++
            log(`[SUCCESS] ${prodId} - ${prodName} updated (${updatedUrls.length} URLs)`)
          } catch (err) {
            failed++
            log(
              `[FAILED] ${prodId} - ${prodName}: ${err instanceof Error ? err.message : 'Unknown error'}`,
            )
          }
        }),
      ),
    )

    const summary = `
=== Category Refresh Summary for ${category} ===
Total products: ${products.length}
Refreshed: ${refreshed}
Skipped: ${skipped}
Failed: ${failed}
Time: ${new Date().toISOString()}
`.trim()

    log(summary)

    return NextResponse.json({
      ok: true,
      total: products.length,
      refreshed,
      skipped,
      failed,
    })
  } catch (err) {
    console.error('[refresh/category]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    if (category) runningCategories.delete(category)
  }
}

// import { NextResponse } from 'next/server'
// import pLimit from 'p-limit'
// import { getPayload } from 'payload'
// import config from '@/payload.config'
// import { crawlProduct } from '@/lib/crawler/crawler'

// const PRODUCT_CONCURRENCY = 2 // max products in parallel
// const URL_CONCURRENCY = 5 // max URLs per product in parallel
// const MIN_REFRESH_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

// // In-memory lock for categories
// const runningCategories = new Set<string>()

// export async function POST(req: Request) {
//   let category: string | undefined // store category for finally block

//   try {
//     const body = await req.json()
//     category = body.category
//     const { brand, limit = 50 } = body

//     if (!category) {
//       return NextResponse.json({ error: 'category is required' }, { status: 400 })
//     }

//     // ✅ Check if category is already being refreshed
//     if (runningCategories.has(category)) {
//       return NextResponse.json(
//         { ok: false, message: 'Category is already being refreshed' },
//         { status: 409 },
//       )
//     }

//     runningCategories.add(category) // lock

//     const payload = await getPayload({ config })

//     // 1️⃣ Find products
//     const products = await payload.find({
//       collection: 'product-links',
//       where: {
//         disable: {
//           not_equals: true,
//         },
//         ...(category && { category: { equals: category } }),
//         ...(brand && { brand: { equals: brand } }),
//       },
//       limit,
//       depth: 0,
//     })

//     const productLimit = pLimit(PRODUCT_CONCURRENCY)
//     const urlLimit = pLimit(URL_CONCURRENCY)

//     let refreshed = 0
//     let skipped = 0

//     // 2️⃣ Controlled refresh
//     await Promise.all(
//       products.docs.map((product) =>
//         productLimit(async () => {
//           if (product.disable === true) {
//             skipped++
//             console.log(`[Skip - Disabled] Product ${product.id} - Disabled`)
//             return
//           }
//           if (
//             (product.updatedAt &&
//               Date.now() - new Date(product.updatedAt).getTime() < MIN_REFRESH_INTERVAL_MS) ||
//             !product.productUrls ||
//             !Array.isArray(product.productUrls) ||
//             product.productUrls.length === 0
//           ) {
//             skipped++
//             console.log(
//               `[Skip] Product ${product.id} - ${
//                 !product.productUrls || product.productUrls.length === 0
//                   ? 'No URLs'
//                   : 'Recently updated'
//               }`,
//             )
//             return
//           }

//           const updatedProductUrls = await Promise.all(
//             product.productUrls.map((urlEntry: any) =>
//               urlLimit(async () => {
//                 if (!urlEntry.url) return urlEntry

//                 try {
//                   const result = await crawlProduct(urlEntry.url, urlEntry.site || 'torob')

//                   const crawlStatus: 'success' | 'failed' | 'pending' = result.success
//                     ? 'success'
//                     : 'failed'

//                   const newPriceHistory = [...(urlEntry.priceHistory || [])]
//                   if (result.success && result.price !== null) {
//                     newPriceHistory.push({
//                       price: result.price,
//                       crawledAt: new Date().toISOString(),
//                     })
//                   }

//                   return {
//                     ...urlEntry,
//                     currentPrice:
//                       result.success && result.price !== null
//                         ? result.price
//                         : urlEntry.currentPrice,
//                     lastCrawledAt: new Date().toISOString(),
//                     crawlStatus,
//                     crawlError: result.success ? null : result.error || 'Unknown error',
//                     priceHistory: newPriceHistory,
//                   }
//                 } catch (err) {
//                   return {
//                     ...urlEntry,
//                     crawlStatus: 'failed' as const,
//                     crawlError: err instanceof Error ? err.message : 'Unknown error',
//                   }
//                 }
//               }),
//             ),
//           )

//           await payload.update({
//             collection: 'product-links',
//             id: product.id,
//             data: { productUrls: updatedProductUrls },
//             depth: 0,
//           })

//           console.log(
//             `[Update] Product ${product.id} updated with ${updatedProductUrls.length} URL(s)`,
//           )
//           refreshed++
//         }),
//       ),
//     )

//     return NextResponse.json({
//       ok: true,
//       total: products.docs.length,
//       refreshed,
//       skipped,
//     })
//   } catch (err) {
//     console.error('[refresh/category]', err)
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
//   } finally {
//     if (category) runningCategories.delete(category) // always unlock
//   }
// }
