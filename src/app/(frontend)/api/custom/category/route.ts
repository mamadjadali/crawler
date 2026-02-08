import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET() {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const results = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 1000,
      sort: 'name',
    })

    const categoriesWithCount = await Promise.all(
      results.docs.map(async (cat: any) => {
        const countResult = await payload.find({
          collection: 'product-links', // your product collection
          where: {
            category: { equals: cat.id },
            or: [{ disable: { equals: false } }, { disable: { exists: false } }],
          },
          limit: 0, // we just need the totalDocs
        })

        return {
          id: cat.id,
          name: cat.name,
          count: countResult.totalDocs || 0,
        }
      }),
    )

    // return Response.json({
    //   categories: results.docs.map((cat: any) => ({
    //     id: cat.id,
    //     name: cat.name,
    //   })),
    // })
    return Response.json({
      categories: categoriesWithCount, // <- return the one with counts
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
