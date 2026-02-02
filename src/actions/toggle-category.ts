// // app/actions/toggle-category.ts
// 'use server'

// import { getPayload } from 'payload'
// import configPromise from '@/payload.config'
// import { getClient } from './getClient'
// import { Category } from '@/payload-types';

// export async function toggleCategoryAction(
//   categoryId: string,
//   category: Category,
//   shouldBeVisible: boolean,
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     const client = await getClient()

//     if (!client?.id) {
//       return { success: false, error: 'Not authenticated' }
//     }

//     const payload = await getPayload({ config: await configPromise })

//     const operation = shouldBeVisible ? '$addToSet' : '$pull'

//     await payload.update({
//       collection: 'clients', // ← change ONLY if your users collection slug is different
//       id: client.id,
//       data: {
//         visibleCategories: {
//           [operation]: categoryId,
//         } as any,  // TS workaround for MongoDB operator
//       },
//     })

//     // Optional: if you want other pages/components to refresh immediately
//     // import { revalidatePath } from 'next/cache'
//     // revalidatePath('/dashboard')           // or whatever path uses visibleCategories

//     return { success: true }
//   } catch (err: any) {
//     console.error('[toggleCategoryAction]', err)
//     return {
//       success: false,
//       error: err.message || 'خطا در به‌روزرسانی دسته‌بندی‌ها',
//     }
//   }
// }
