import { NextResponse } from 'next/server'
import pLimit from 'p-limit'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { crawlProduct } from '@/lib/crawler/crawler'

const PRODUCT_CONCURRENCY = 2 // max products in parallel
const URL_CONCURRENCY = 5 // max URLs per product in parallel
const MIN_REFRESH_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

// In-memory lock for categories
const runningCategories = new Set<string>()

export async function POST(req: Request) {
  let category: string | undefined // store category for finally block

  try {
    const body = await req.json()
    category = body.category
    const { brand, limit = 50 } = body

    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 })
    }

    // ✅ Check if category is already being refreshed
    if (runningCategories.has(category)) {
      return NextResponse.json(
        { ok: false, message: 'Category is already being refreshed' },
        { status: 409 },
      )
    }

    runningCategories.add(category) // lock

    const payload = await getPayload({ config })

    // 1️⃣ Find products
    const products = await payload.find({
      collection: 'product-links',
      where: {
        disable: {
          not_equals: true,
        },
        ...(category && { category: { equals: category } }),
        ...(brand && { brand: { equals: brand } }),
      },
      limit,
      depth: 0,
    })

    const productLimit = pLimit(PRODUCT_CONCURRENCY)
    const urlLimit = pLimit(URL_CONCURRENCY)

    let refreshed = 0
    let skipped = 0

    // 2️⃣ Controlled refresh
    await Promise.all(
      products.docs.map((product) =>
        productLimit(async () => {
          if (product.disable === true) {
            skipped++
            console.log(`[Skip - Disabled] Product ${product.id} - Disabled`)
            return
          }
          if (
            (product.updatedAt &&
              Date.now() - new Date(product.updatedAt).getTime() < MIN_REFRESH_INTERVAL_MS) ||
            !product.productUrls ||
            !Array.isArray(product.productUrls) ||
            product.productUrls.length === 0
          ) {
            skipped++
            console.log(
              `[Skip] Product ${product.id} - ${
                !product.productUrls || product.productUrls.length === 0
                  ? 'No URLs'
                  : 'Recently updated'
              }`,
            )
            return
          }

          const updatedProductUrls = await Promise.all(
            product.productUrls.map((urlEntry: any) =>
              urlLimit(async () => {
                if (!urlEntry.url) return urlEntry

                try {
                  const result = await crawlProduct(urlEntry.url, urlEntry.site || 'torob')

                  const crawlStatus: 'success' | 'failed' | 'pending' = result.success
                    ? 'success'
                    : 'failed'

                  const newPriceHistory = [...(urlEntry.priceHistory || [])]
                  if (result.success && result.price !== null) {
                    newPriceHistory.push({
                      price: result.price,
                      crawledAt: new Date().toISOString(),
                    })
                  }

                  return {
                    ...urlEntry,
                    currentPrice:
                      result.success && result.price !== null
                        ? result.price
                        : urlEntry.currentPrice,
                    lastCrawledAt: new Date().toISOString(),
                    crawlStatus,
                    crawlError: result.success ? null : result.error || 'Unknown error',
                    priceHistory: newPriceHistory,
                  }
                } catch (err) {
                  return {
                    ...urlEntry,
                    crawlStatus: 'failed' as const,
                    crawlError: err instanceof Error ? err.message : 'Unknown error',
                  }
                }
              }),
            ),
          )

          await payload.update({
            collection: 'product-links',
            id: product.id,
            data: { productUrls: updatedProductUrls },
            depth: 0,
          })

          console.log(
            `[Update] Product ${product.id} updated with ${updatedProductUrls.length} URL(s)`,
          )
          refreshed++
        }),
      ),
    )

    return NextResponse.json({
      ok: true,
      total: products.docs.length,
      refreshed,
      skipped,
    })
  } catch (err) {
    console.error('[refresh/category]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    if (category) runningCategories.delete(category) // always unlock
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

// // In-memory lock
// const runningCategories = new Set<string>()

// export async function POST(req: Request) {
//   try {
//     const body = await req.json()
//     const { category, brand, limit = 50 } = body

//     if (!category) {
//       return NextResponse.json({ error: 'category is required' }, { status: 400 })
//     }

//     // ✅ Check lock
//     if (runningCategories.has(category)) {
//       return NextResponse.json({
//         ok: false,
//         message: 'Category is already being refreshed',
//       }, { status: 409 })
//     }

//     runningCategories.add(category) // lock

//     const payload = await getPayload({ config })

//     // 1️⃣ Find products
//     const products = await payload.find({
//       collection: 'product-links',
//       where: {
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
//           // Skip products updated too recently
//           // Check if product should be skipped
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

//           // Crawl each URL with concurrency
//           const updatedProductUrls = await Promise.all(
//             product.productUrls.map((urlEntry: any) =>
//               urlLimit(async () => {
//                 if (!urlEntry.url) return urlEntry

//                 try {
//                   const result = await crawlProduct(urlEntry.url, urlEntry.site || 'torob')

//                   // Use exact union type for crawlStatus
//                   const crawlStatus: 'success' | 'failed' | 'pending' = result.success
//                     ? 'success'
//                     : 'failed'

//                   console.log(
//                     `[Crawl] Product ${product.id} - URL: ${urlEntry.url.substring(0, 50)}... | Status: ${crawlStatus} | Price: ${
//                       result.price?.toLocaleString() || 'N/A'
//                     }`,
//                   )

//                   // Build mutable priceHistory array
//                   const newPriceHistory: {
//                     price: number
//                     crawledAt: string
//                     id?: string | null
//                   }[] = [...(urlEntry.priceHistory || [])]

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

//           // Update the product in Payload
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
//     runningCategories.delete(req.json().category) // always unlock
//   }
// }
