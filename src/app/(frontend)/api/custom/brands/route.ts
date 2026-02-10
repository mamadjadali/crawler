import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Brand } from '@/payload-types'

export async function GET() {
  try {
    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Find all brands (use no generic, just let Payload infer)
    const results = await payload.find({
      collection: 'brands',
      depth: 0,
      limit: 1000,
      sort: 'name',
    })

    const brandsWithCount = await Promise.all(
      results.docs.map(async (brand) => {
        // assert type manually
        const b = brand as Brand

        const countResult = await payload.find({
          collection: 'product-links',
          where: {
            brand: { equals: b.id },
            or: [{ disable: { equals: false } }, { disable: { exists: false } }],
          },
          limit: 0,
        })

        return {
          id: b.id,
          name: b.name,
          count: countResult.totalDocs || 0,
        }
      }),
    )

    return Response.json({ brands: brandsWithCount })
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

// import { getPayload } from 'payload'
// import config from '@/payload.config'

// export async function GET() {
//   try {
//     const payloadConfig = await config
//     const payload = await getPayload({ config: payloadConfig })

//     const results = await payload.find({
//       collection: 'brands',
//       depth: 0,
//       limit: 1000,
//       sort: 'name',
//     })

//     const brandsWithCount = await Promise.all(
//       results.docs.map(async (brand: any) => {
//         const countResult = await payload.find({
//           collection: 'product-links', // your product collection
//           where: {
//             brand: { equals: brand.id },
//             or: [{ disable: { equals: false } }, { disable: { exists: false } }],
//           },
//           limit: 0, // we only need totalDocs
//         })

//         return {
//           id: brand.id,
//           name: brand.name,
//           count: countResult.totalDocs || 0,
//         }
//       }),
//     )

//     return Response.json({
//       brands: brandsWithCount,
//     })
//   } catch (error) {
//     console.error('Brands error:', error)
//     return Response.json(
//       {
//         error: 'Failed to load brands',
//         message: error instanceof Error ? error.message : 'Unknown error',
//       },
//       { status: 500 },
//     )
//   }
// }
