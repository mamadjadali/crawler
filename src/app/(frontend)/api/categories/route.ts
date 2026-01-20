// src/app/api/categories/route.ts
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import payloadConfig from '@/payload.config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config: payloadConfig })

    // Fetch all categories
    const results = await payload.find({
      collection: 'categories',
      limit: 100, // adjust if needed or implement pagination
      sort: 'name', // sort alphabetically
    })

    // Transform for frontend: { id, name }
    const categories = results.docs.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
    }))

    return Response.json({ categories })
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return Response.json(
      {
        error: 'Failed to fetch categories',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
