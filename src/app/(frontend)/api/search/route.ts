import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // console.log('Incoming URL:', request.url)
    // console.log('Incoming searchParams:', Array.from(request.nextUrl.searchParams.entries()))

    // const searchParams = request.nextUrl.searchParams
    const url = new URL(request.url)
    const query = url.searchParams.get('q')
    const category = url.searchParams.get('category')
    const brand = url.searchParams.get('brand')

    const trimmedQuery = query?.trim() ?? ''
    const trimmedCategory = category?.trim() ?? ''
    const trimmedBrand = brand?.trim() ?? ''

    // console.log('Search Params:', {
    //   query: trimmedQuery,
    //   category: trimmedCategory,
    //   brand: trimmedBrand,
    // })
    // If neither search, category, or brand is provided, return empty
    if (!trimmedQuery && !trimmedCategory && !trimmedBrand) {
      return Response.json({ docs: [], totalDocs: 0 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    const filters: any[] = []

    if (trimmedCategory) {
      filters.push({ category: { equals: trimmedCategory } })
    }

    if (trimmedBrand) {
      filters.push({ brand: { equals: trimmedBrand } }) // correct Payload syntax
    }

    const searchFilter = trimmedQuery
      ? {
          or: [{ name: { contains: trimmedQuery } }, { productId: { contains: trimmedQuery } }],
        }
      : null

    // Combine filters and search
    let where: any
    if (filters.length && searchFilter) {
      where = { and: [...filters, searchFilter] }
    } else if (filters.length) {
      where = filters.length === 1 ? filters[0] : { and: filters }
    } else {
      where = searchFilter
    }

    // console.log('Payload "where" filter:', JSON.stringify(where, null, 2))

    const results = await payload.find({
      collection: 'product-links',
      where,
      depth: 1,
      limit: 100,
      sort: '-createdAt',
    })

    // console.log('Results found:', results.totalDocs)

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
      { status: 500 },
    )
  }
}

// import { getPayload } from 'payload'
// import config from '@/payload.config'
// import { NextRequest } from 'next/server'

// export async function GET(request: NextRequest) {
//   try {
//     const searchParams = request.nextUrl.searchParams
//     const query = searchParams.get('q')
//     const category = searchParams.get('category')
//     const brand = searchParams.get('brand')

//     const trimmedQuery = query?.trim() ?? ''
//     const trimmedCategory = category?.trim() ?? ''
//     const trimmedBrand = brand?.trim() ?? ''

//     // If neither search nor category is provided, return empty (UI falls back to initialProducts)
//     if (!trimmedQuery && !trimmedCategory && !trimmedBrand) {
//       return Response.json({ docs: [], totalDocs: 0 })
//     }

//     const payloadConfig = await config
//     const payload = await getPayload({ config: payloadConfig })

//     const where: any =
//       trimmedCategory && !trimmedQuery
//         ? { category: { equals: trimmedCategory } }// category-only
//         : trimmedCategory && trimmedQuery
//           ? {
//               // category + search
//               and: [
//                 { category: { equals: trimmedCategory } },
//                 {
//                   or: [
//                     { name: { contains: trimmedQuery } },
//                     { productId: { contains: trimmedQuery } },
//                   ],
//                 },
//               ],
//             }
//           : {
//               // search-only
//               or: [{ name: { contains: trimmedQuery } }, { productId: { contains: trimmedQuery } }],
//             }
//     // Query product-links collection directly with search terms
//     const results = await payload.find({
//       collection: 'product-links',
//       where,
//       depth: 1,
//       limit: 100,
//       sort: '-createdAt',
//     })

//     return Response.json({
//       docs: results.docs,
//       totalDocs: results.totalDocs,
//     })
//   } catch (error) {
//     console.error('Search error:', error)
//     return Response.json(
//       {
//         error: 'Failed to search products',
//         message: error instanceof Error ? error.message : 'Unknown error',
//       },
//       { status: 500 },
//     )
//   }
// }
