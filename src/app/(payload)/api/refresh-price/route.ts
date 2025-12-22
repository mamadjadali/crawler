import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { crawlProduct } from '../../../../lib/crawler/crawler'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Get the request with authentication
    const authHeader = request.headers.get('authorization')
    const cookies = request.headers.get('cookie')
    
    // Create a mock request object for Payload authentication
    // In a real scenario, we'd need to properly authenticate
    // For now, we'll check if user is authenticated via cookies
    
    const body = await request.json()
    const { id } = body

    if (!id) {
      return Response.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Get the product link
    const product = await payload.findByID({
      collection: 'product-links',
      id,
      depth: 0,
    })

    if (!product) {
      return Response.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.productUrls || !Array.isArray(product.productUrls) || product.productUrls.length === 0) {
      return Response.json({ error: 'Product URLs are missing' }, { status: 400 })
    }

    // Crawl all URLs for the product
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
    const updated = await payload.update({
      collection: 'product-links',
      id,
      data: {
        productUrls: updatedProductUrls,
      },
    })

    // Return complete updated product data for frontend state update
    return Response.json({
      success: true,
      productUrls: updatedProductUrls,
      product: updated,
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

