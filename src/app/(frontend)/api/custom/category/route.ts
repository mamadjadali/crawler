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

    return Response.json({
      categories: results.docs.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
      })),
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
