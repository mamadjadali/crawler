import { getPayload, Where } from 'payload'
import config from '@/payload.config'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const query = url.searchParams.get('q')
    const category = url.searchParams.get('category')
    const brand = url.searchParams.get('brand')

    const trimmedQuery = query?.trim() ?? ''
    const trimmedCategory = category?.trim() ?? ''
    const trimmedBrand = brand?.trim() ?? ''

    if (!trimmedQuery && !trimmedCategory && !trimmedBrand) {
      return Response.json({ docs: [], totalDocs: 0 })
    }

    const payloadConfig = await config
    const payload = await getPayload({ config: payloadConfig })

    // Typed as array of objects
    const filters: Where[] = []
    const disabledFilter: Where = { disable: { not_equals: true } }

    if (trimmedCategory) {
      filters.push({ category: { equals: trimmedCategory } })
    }

    if (trimmedBrand) {
      filters.push({ brand: { equals: trimmedBrand } })
    }

    const searchFilter: Where | null = trimmedQuery
      ? {
          or: [{ name: { contains: trimmedQuery } }, { productId: { contains: trimmedQuery } }],
        }
      : null

    // Combine filters
    let where: Where
    if (filters.length && searchFilter) {
      where = { and: [disabledFilter, ...filters, searchFilter] }
    } else if (filters.length) {
      where = { and: [disabledFilter, ...filters] }
    } else if (searchFilter) {
      where = { and: [disabledFilter, searchFilter] }
    } else {
      where = disabledFilter
    }

    const results = await payload.find({
      collection: 'product-links',
      where,
      depth: 1,
      limit: 300,
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
      { status: 500 },
    )
  }
}

// import { getPayload } from 'payload'
// import config from '@/payload.config'
// import { NextRequest } from 'next/server'

// export async function GET(request: NextRequest) {
//   try {
//     const url = new URL(request.url)
//     const query = url.searchParams.get('q')
//     const category = url.searchParams.get('category')
//     const brand = url.searchParams.get('brand')

//     const trimmedQuery = query?.trim() ?? ''
//     const trimmedCategory = category?.trim() ?? ''
//     const trimmedBrand = brand?.trim() ?? ''

//     if (!trimmedQuery && !trimmedCategory && !trimmedBrand) {
//       return Response.json({ docs: [], totalDocs: 0 })
//     }

//     const payloadConfig = await config
//     const payload = await getPayload({ config: payloadConfig })

//     const filters: any[] = []
//     const disabledFilter = { disable: { not_equals: true } }

//     if (trimmedCategory) {
//       filters.push({ category: { equals: trimmedCategory } })
//     }

//     if (trimmedBrand) {
//       filters.push({ brand: { equals: trimmedBrand } }) // correct Payload syntax
//     }

//     const searchFilter = trimmedQuery
//       ? {
//           or: [{ name: { contains: trimmedQuery } }, { productId: { contains: trimmedQuery } }],
//         }
//       : null

//     // Combine filters and search
//     // let where: any
//     // if (filters.length && searchFilter) {
//     //   where = { and: [disabledFilter, ...filters, searchFilter] }
//     // } else if (filters.length) {
//     //   where = filters.length === 1 ? filters[0] : { and: filters }
//     // } else {
//     //   where = searchFilter
//     // }
//     let where: any

//     if (filters.length && searchFilter) {
//       where = { and: [disabledFilter, ...filters, searchFilter] }
//     } else if (filters.length) {
//       where = { and: [disabledFilter, ...filters] }
//     } else if (searchFilter) {
//       where = { and: [disabledFilter, searchFilter] }
//     } else {
//       where = disabledFilter
//     }

//     // console.log('Payload "where" filter:', JSON.stringify(where, null, 2))

//     const results = await payload.find({
//       collection: 'product-links',
//       where,
//       depth: 1,
//       limit: 100,
//       sort: '-createdAt',
//     })

//     // console.log('Results found:', results.totalDocs)

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
