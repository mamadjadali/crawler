import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET() {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const results = await payload.find({
      collection: 'brands',
      depth: 0,
      limit: 1000,
      sort: 'name',
    })

    return Response.json({
      brands: results.docs.map((brand: any) => ({
        id: brand.id,
        name: brand.name,
      })),
    })
  } catch (error) {
    console.error('Brands error:', error)
    return Response.json(
      {
        error: 'Failed to load brands',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
