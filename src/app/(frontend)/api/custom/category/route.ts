import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Category } from '@/payload-types'

export async function GET() {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Fetch categories
    const results = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1000,
      sort: 'name',
    })

    const categoriesWithCount = await Promise.all(
      results.docs.map(async (cat) => {
        // Assert type manually
        const c = cat as Category

        const countResult = await payload.find({
          collection: 'product-links',
          where: {
            category: { equals: c.id },
            or: [{ disable: { equals: false } }, { disable: { exists: false } }],
          },
          limit: 0,
        })

        return {
          id: c.id,
          name: c.name,
          count: countResult.totalDocs || 0,
        }
      }),
    )

    return Response.json({
      categories: categoriesWithCount,
    })
  } catch (error) {
    console.error('Categories error:', error)
    return Response.json(
      {
        error: 'Failed to load categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
