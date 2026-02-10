import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChessBishop,
  ChessKnight,
  ChessPawn,
  ChessQueen,
  ChessRook,
  Crown,
  Mail,
  Puzzle,
  Swords,
  User,
} from 'lucide-react'
import { LogoutButton } from './LogoutButton'

const ROLE_ICON: Record<string, React.ReactNode> = {
  god: <Swords className="ml-1 size-5 text-blue-500" />,
  king: <Crown className="ml-1 size-5 text-purple-500" />,
  queen: <ChessQueen className="ml-1 size-5 text-sky-500" />,
  rook: <ChessRook className="ml-1 size-5 text-neutral-700" />,
  bishop: <ChessBishop className="ml-1 size-5 text-neutral-700" />,
  knight: <ChessKnight className="ml-1 size-5 text-neutral-700" />,
  pawn: <ChessPawn className="ml-1 size-5 text-neutral-700" />,
}

export const ROLE_LABEL_FA: Record<string, string> = {
  god: 'خــدا',
  king: 'شـاه',
  queen: 'وزیــر',
  rook: 'رخ',
  bishop: 'فــیل',
  knight: 'اســبــ',
  pawn: 'سربـاز',
}

type Props = {
  email?: string | null
  name: string
  fullname?: string | null
  role: string
  // visibleCategories?: Category[]
}

export function UserProfile({ email, name, fullname, role }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="border-gray-400 w-full shadow-none cursor-pointer text-neutral-700 rounded-lg"
        >
          {ROLE_ICON[role]}
          {fullname}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-white border border-gray-400 ">
        <DropdownMenuGroup>
          {name && (
            <DropdownMenuItem className="font-sans text-neutral-700 mb-1">
              <User />
              {name}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          {email && (
            <DropdownMenuItem className="font-sans text-neutral-700 mb-1">
              <Mail />
              {email}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuGroup>
          {role && (
            <DropdownMenuItem className=" text-neutral-700">
              <Puzzle />
              {ROLE_LABEL_FA[role] || role}
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-gray-200 mx-1 my-2" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild dir="rtl" variant="destructive" className="cursor-pointer">
            <LogoutButton />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// 'use client'

// import { useEffect, useState, useTransition } from 'react'
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuGroup,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu'
// import { Button } from '@/components/ui/button'
// import { Switch } from '@/components/ui/switch'
// import { Label } from '@/components/ui/label'
// import { Loader2 } from 'lucide-react'

// import {
//   ChessBishop,
//   ChessKnight,
//   ChessPawn,
//   ChessQueen,
//   ChessRook,
//   Crown,
//   Mail,
//   Puzzle,
//   Swords,
//   User,
// } from 'lucide-react'

// import { LogoutButton } from './LogoutButton'
// import { Category } from '@/payload-types'

// import { toggleCategoryAction } from '@/actions/toggle-category' // ← adjust path to where your action is

// const ROLE_ICON: Record<string, React.ReactNode> = {
//   god: <Swords className="ml-1 size-5 text-blue-500" />,
//   king: <Crown className="ml-1 size-5 text-purple-500" />,
//   queen: <ChessQueen className="ml-1 size-5 text-sky-500" />,
//   rook: <ChessRook className="ml-1 size-5 text-neutral-700" />,
//   bishop: <ChessBishop className="ml-1 size-5 text-neutral-700" />,
//   knight: <ChessKnight className="ml-1 size-5 text-neutral-700" />,
//   pawn: <ChessPawn className="ml-1 size-5 text-neutral-700" />,
// }

// export const ROLE_LABEL_FA: Record<string, string> = {
//   god: 'خــدا',
//   king: 'شـاه',
//   queen: 'وزیــر',
//   rook: 'رخ',
//   bishop: 'فــیل',
//   knight: 'اســبــ',
//   pawn: 'سربـاز',
// }

// type Props = {
//   email?: string | null
//   name: string
//   fullname?: string | null
//   role: string
//   visibleCategories?: Category[]
// }

// export function UserProfile({ email, name, fullname, role, visibleCategories = [] }: Props) {
//   const [allCategories, setAllCategories] = useState<Category[]>([])
//   const [loadingCategories, setLoadingCategories] = useState(true)
//   const [fetchError, setFetchError] = useState<string | null>(null)

//   const [optimisticVisibleIds, setOptimisticVisibleIds] = useState<Set<string>>(
//     new Set(visibleCategories.map((cat) => cat.id)),
//   )

//   const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set())

//   const [isPending, startTransition] = useTransition()

//   // Load all categories once
//   useEffect(() => {
//     async function fetchCategories() {
//       try {
//         const res = await fetch('/api/custom/category', {
//           cache: 'no-store',
//           next: { revalidate: 0 },
//         })

//         if (!res.ok) throw new Error('Failed to load categories')

//         const data = await res.json()
//         // Adjust depending on your endpoint response shape
//         const categories = Array.isArray(data) ? data : (data.docs ?? data.categories ?? [])
//         setAllCategories(categories)
//       } catch (err) {
//         console.error(err)
//         setFetchError('ناتوان در بارگذاری دسته‌بندی‌ها')
//       } finally {
//         setLoadingCategories(false)
//       }
//     }

//     fetchCategories()
//   }, [])

//   const handleToggle = (categoryId: string, checked: boolean) => {
//     startTransition(async () => {
//       // 1. Optimistic update
//       setOptimisticVisibleIds((prev) => {
//         const next = new Set(prev)
//         if (checked) next.add(categoryId)
//         else next.delete(categoryId)
//         return next
//       })

//       // 2. Track pending
//       setPendingToggles((prev) => new Set([...prev, categoryId]))

//       // 3. Call server action
//       const result = await toggleCategoryAction(categoryId, checked)

//       // 4. Clean up pending
//       setPendingToggles((prev) => {
//         const next = new Set(prev)
//         next.delete(categoryId)
//         return next
//       })

//       // 5. Rollback on failure
//       if (!result.success) {
//         setOptimisticVisibleIds((prev) => {
//           const next = new Set(prev)
//           if (checked) next.delete(categoryId)
//           else next.add(categoryId)
//           return next
//         })
//         // You can show toast here later
//         console.error(result.error)
//       }
//     })
//   }

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button
//           variant="outline"
//           className="border-gray-400 cursor-pointer text-neutral-700 rounded-lg gap-2"
//         >
//           {ROLE_ICON[role]}
//           {fullname || 'کاربر'}
//         </Button>
//       </DropdownMenuTrigger>

//       <DropdownMenuContent className="bg-white border border-gray-400 w-80 max-h-[70vh] overflow-y-auto">
//         {/* User info */}
//         {name && (
//           <DropdownMenuGroup>
//             <DropdownMenuItem className="font-sans text-neutral-700">
//               <User className="mr-2 h-4 w-4" />
//               {name}
//             </DropdownMenuItem>
//           </DropdownMenuGroup>
//         )}

//         {email && (
//           <DropdownMenuGroup>
//             <DropdownMenuItem className="font-sans text-neutral-700">
//               <Mail className="mr-2 h-4 w-4" />
//               {email}
//             </DropdownMenuItem>
//           </DropdownMenuGroup>
//         )}

//         {role && (
//           <DropdownMenuGroup>
//             <DropdownMenuItem className="text-neutral-700">
//               <Puzzle className="mr-2 h-4 w-4" />
//               {ROLE_LABEL_FA[role] || role}
//             </DropdownMenuItem>
//           </DropdownMenuGroup>
//         )}

//         <DropdownMenuSeparator className="bg-gray-200 mx-2 my-2" />

//         {/* Categories toggles */}
//         <DropdownMenuGroup>
//           <DropdownMenuLabel className="px-2 py-1.5 text-sm font-medium text-neutral-600">
//             دسته‌بندی‌های قابل نمایش
//           </DropdownMenuLabel>

//           {loadingCategories ? (
//             <div className="px-4 py-6 flex justify-center">
//               <Loader2 className="h-5 w-5 animate-spin text-neutral-500" />
//             </div>
//           ) : fetchError ? (
//             <DropdownMenuItem className="text-red-600 justify-center py-4 text-sm">
//               {fetchError}
//             </DropdownMenuItem>
//           ) : allCategories.length === 0 ? (
//             <DropdownMenuItem disabled className="justify-center py-4 text-sm text-neutral-500">
//               دسته‌بندی یافت نشد
//             </DropdownMenuItem>
//           ) : (
//             allCategories.map((category) => {
//               const isVisible = optimisticVisibleIds.has(category.id)
//               const isPending = pendingToggles.has(category.id)
//               const disabled = isPending || isPending // during transition

//               return (
//                 <DropdownMenuItem
//                   key={category.id}
//                   className="px-3 py-2 focus:bg-transparent cursor-default hover:bg-gray-50"
//                   onSelect={(e) => e.preventDefault()}
//                 >
//                   <div className="flex items-center justify-between w-full gap-3">
//                     <Label
//                       htmlFor={`cat-switch-${category.id}`}
//                       className="text-neutral-800 cursor-pointer flex-1 truncate"
//                     >
//                       {category.name}
//                     </Label>

//                     <Switch
//                       id={`cat-switch-${category.id}`}
//                       checked={isVisible}
//                       disabled={disabled}
//                       onCheckedChange={(checked) => handleToggle(category.id, checked)}
//                     />
//                   </div>
//                 </DropdownMenuItem>
//               )
//             })
//           )}
//         </DropdownMenuGroup>

//         <DropdownMenuSeparator className="bg-gray-200 mx-2 my-2" />

//         <DropdownMenuGroup>
//           <DropdownMenuItem asChild dir="rtl" className="cursor-pointer">
//             <LogoutButton />
//           </DropdownMenuItem>
//         </DropdownMenuGroup>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   )
// }
