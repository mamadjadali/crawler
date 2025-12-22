import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim() === '') {
      return Response.json({ docs: [], totalDocs: 0 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Query product-links collection directly with search terms
    const results = await payload.find({
      collection: 'product-links',
      where: {
        or: [
          { name: { contains: query } },
          { productId: { contains: query } },
          { url: { contains: query } },
        ],
      },
      depth: 1,
      limit: 100,
      sort: '-createdAt',
    })

    return Response.json({
      docs: results.docs,
      totalDocs: results.totalDocs,
    })
  } catch (error) {
    console.error('Search error:', error)
    return Response.json(
      {
        error: 'Failed to search products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

