import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'product-links',
      where: {
        disable: { equals: true },
      },
      sort: '-createdAt',
      limit: 400,
      depth: 1,
    })

    return NextResponse.json({
      success: true,
      data: docs,
    })
  } catch (error) {
    console.error('[DISABLED_PRODUCTS_API]', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch disabled products',
      },
      { status: 500 },
    )
  }
}
