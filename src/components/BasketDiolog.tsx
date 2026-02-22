'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { ProductLink } from '@/payload-types'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import { Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { BsFillBasketFill } from 'react-icons/bs'
import BasketProductButton from './BasketProduct'

type Currency = 'USD' | 'AED'

type BasketItem = ProductLink & {
  quantity: number
  purchasePrice: number // renamed from purchasePriceUSD
  purchaseCurrency: Currency // ← new: per product
}

interface BasketDialogProps {
  usd: number | null
  aed: number | null
}

export default function BasketProductsDialog({ usd, aed }: BasketDialogProps) {
  const [items, setItems] = useState<BasketItem[]>([])
  const [loading, setLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const USD_TO_TOMAN = usd ?? 0
  const AED_TO_TOMAN = aed ?? 0

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/custom/basket')
      const json = await res.json()
      const enriched = (json.data ?? []).map((p: ProductLink) => ({
        ...p,
        quantity: 1,
        purchasePrice: 0,
        purchaseCurrency: 'USD' as Currency, // default – you can change logic later
      }))
      setItems(enriched)
    } catch (err) {
      console.error('Failed to load basket', err)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = (productId: string, newQty: number) => {
    if (newQty < 1) newQty = 1
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity: newQty } : item)),
    )
  }

  const updatePurchasePrice = (productId: string, value: string) => {
    const num = parseFloat(value) || 0
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, purchasePrice: num } : item)),
    )
  }

  const updateCurrency = (productId: string, currency: Currency) => {
    setItems((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, purchaseCurrency: currency } : item)),
    )
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId))
  }

  const summaryRef = useRef<HTMLDivElement>(null)

  const exportToPDF = async () => {
    if (!summaryRef.current) return
    setIsExporting(true)
    try {
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2, // better quality
        useCORS: true, // if you have external images
        logging: false,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()

      const imgWidth = canvas.width
      const imgHeight = canvas.height

      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 10 // small top margin

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      pdf.save(`basket-summary-${new Date().toISOString().slice(0, 10)}.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('متأسفانه در ساخت PDF مشکلی پیش آمد')
    } finally {
      setIsExporting(false)
    }
  }

  const exportToPNG = async () => {
    if (!summaryRef.current) return
    setIsExporting(true)
    try {
      const canvas = await html2canvas(summaryRef.current, { scale: 3 })
      const link = document.createElement('a')
      link.download = `basket-summary-${new Date().toISOString().slice(0, 10)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('PNG export failed:', err)
    } finally {
      setIsExporting(false)
    }
  }

  // ────────────────────────────────────────────────
  //               CALCULATIONS
  // ────────────────────────────────────────────────

  const toPersianDigits = (value: string) => value.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

  const toEnglishDigits = (value: string) =>
    value.replace(/[۰-۹]/g, (d) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])

  const calculations = items.map((item) => {
    const rate = item.purchaseCurrency === 'USD' ? USD_TO_TOMAN : AED_TO_TOMAN
    const costToman = item.purchasePrice * rate
    const lineTotalToman = costToman * item.quantity
    const marketPrice = Number(item.lowestPrice) || 0
    const bestBuyPriceToman = marketPrice // assuming lowestPrice is the best available
    const lineBestToman = bestBuyPriceToman * item.quantity

    return {
      ...item,
      costToman,
      lineTotalToman,
      bestBuyPriceToman: bestBuyPriceToman,
      lineBestToman,
      profitToman: lineBestToman - lineTotalToman,
      profitMargin: lineBestToman > 0 ? (lineBestToman - lineTotalToman) / lineBestToman : 0,
    }
  })

  const totals = {
    totalCostToman: calculations.reduce((sum, c) => sum + c.lineTotalToman, 0),
    totalBestBuyToman: calculations.reduce((sum, c) => sum + c.lineBestToman, 0),
    totalMarketLowestToman: calculations.reduce(
      (sum, c) => sum + (Number(c.lowestPrice) || 0) * c.quantity,
      0,
    ),
    totalProfitToman: calculations.reduce((sum, c) => sum + c.profitToman, 0),
  }

  const overall = {
    costUSD: totals.totalCostToman / (USD_TO_TOMAN || 1),
    profitMarginPercent:
      totals.totalBestBuyToman > 0
        ? ((totals.totalBestBuyToman - totals.totalCostToman) / totals.totalBestBuyToman) * 100
        : 0,
    marginVsMarketPercent:
      totals.totalMarketLowestToman > 0
        ? ((totals.totalMarketLowestToman - totals.totalCostToman) /
            totals.totalMarketLowestToman) *
          100
        : 0,
  }

  const decision =
    overall.marginVsMarketPercent > 5
      ? 'خرید مناسب است'
      : overall.marginVsMarketPercent > 0
        ? 'خرید قابل قبول است'
        : 'احتمال ضرر – تجدیدنظر کنید'

  // ────────────────────────────────────────────────

  return (
    <Dialog onOpenChange={(open) => open && loadProducts()}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="rounded-lg shadow-none sm:max-w-5xl cursor-pointer hover:-translate-y-1 duration-100 border-none bg-white text-[#212a72]"
        >
          <BsFillBasketFill />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] sm:max-w-6xl overflow-y-auto p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-bold text-[#212a72]">سبد خرید</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="my-20 flex flex-col items-center gap-4 text-sm text-gray-500">
            <div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-300 border-t-[#212a72]" />
            در حال بارگذاری سبد ...
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="my-24 flex flex-col items-center gap-4 text-sm text-gray-500">
            <BsFillBasketFill className="h-12 w-12 text-gray-300" />
            <p>هیچ محصولی در سبد خرید وجود ندارد</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <>
            <div className="space-y-4">
              {items.map((p, idx) => {
                const calc = calculations[idx]
                const buyPriceToman = calc.costToman

                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap sm:flex-nowrap gap-3 items-center justify-between p-4 bg-white rounded-lg border-none hover:shadow-sm transition-all duration-150"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <BasketProductButton
                        productId={p.id}
                        initialDisabled={true}
                        onHide={() => removeItem(p.id)}
                      />
                    </div>

                    <div className="flex">
                      <span className="font-medium text-[#212a72]">{p.name}</span>
                    </div>

                    {/* Currency selector */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs text-gray-600">ارز</span>
                      <select
                        value={p.purchaseCurrency}
                        onChange={(e) => updateCurrency(p.id, e.target.value as Currency)}
                        className="text-center text-[#212a72] rounded-lg p-2 text-sm bg-[#e6f3ff]"
                      >
                        <option value="USD">دلار</option>
                        <option value="AED">درهم</option>
                      </select>
                    </div>

                    {/* Purchase price input */}
                    <div className="flex flex-col gap-2 max-w-20">
                      <span className="text-xs text-gray-600">قیمت خرید</span>
                      <Input
                        type="text"
                        min="0"
                        step="0.01"
                        value={p.purchasePrice ? toPersianDigits(String(p.purchasePrice)) : ''}
                        onChange={(e) => {
                          const raw = toEnglishDigits(e.target.value)
                          if (/^\d*\.?\d*$/.test(raw)) {
                            updatePurchasePrice(p.id, raw)
                          }
                        }}
                        placeholder="0.00"
                        className="text-center px-2 no-spin border-none bg-[#e6f3ff]"
                      />
                    </div>

                    <div className="w-24 flex flex-col gap-1 max-w-20">
                      <span className="text-xs text-gray-600">تعداد</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        min="1"
                        value={toPersianDigits(String(p.quantity))}
                        onChange={(e) => {
                          const raw = toEnglishDigits(e.target.value)

                          // allow only integers
                          if (!/^\d*$/.test(raw)) return

                          const next = Math.max(1, parseInt(raw || '1', 10))
                          updateQuantity(p.id, next)
                        }}
                        className="text-center no-spin border-none bg-[#e6f3ff]"
                      />
                    </div>

                    <div className="flex flex-col gap-2 max-w-20">
                      <span className="text-xs text-gray-600">قیمت خرید (ت)</span>
                      <span className="font-medium text-[#212a72]">
                        {buyPriceToman.toLocaleString('fa-IR')}
                      </span>
                    </div>

                    <div className="flex flex-col justify-center items-center gap-2 min-w-36">
                      <span className="text-xs text-gray-500">پایین‌ترین قیمت بازار</span>
                      <span className="font-medium text-gray-700">
                        {Number(p.lowestPrice || 0).toLocaleString('fa-IR')}
                      </span>
                    </div>

                    <div className="items-center justify-center flex flex-col gap-2 text-right font-medium text-[#212a72]">
                      <div className="text-sm text-gray-500">جمع</div>
                      {calc.lineTotalToman.toLocaleString('fa-IR')}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ────── SUMMARY / CONCLUSION ────── */}
            <div className="pt-6 border-none bg-white rounded-xl p-5" ref={summaryRef}>
              <h3 className="text-lg font-bold text-[#212a72] mb-4 text-center">
                نتیجه‌گیری سبد خرید
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-gray-600">سبد تمام شده (دلاری)</div>
                  <div className="font-bold text-[#212a72]">
                    {overall.costUSD.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-gray-600">سبد تمام شده تومنی</div>
                  <div className="font-bold text-[#212a72]">
                    {totals.totalCostToman.toLocaleString('fa-IR')} تومان
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-gray-600">جمع سبد بهترین خرید</div>
                  <div className="font-bold text-green-700">
                    {totals.totalBestBuyToman.toLocaleString('fa-IR')} تومان
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-gray-600">جمع پایین‌ترین قیمت‌های بازار</div>
                  <div className="font-bold text-gray-700">
                    {totals.totalMarketLowestToman.toLocaleString('fa-IR')} تومان
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-gray-600">سود خرید سبد (تومان)</div>
                  <div
                    className={`font-bold ${totals.totalProfitToman >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {totals.totalProfitToman.toLocaleString('fa-IR')} تومان
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-gray-600">حاشیه سود حاصل از خرید</div>
                  <div className="font-bold text-purple-700">
                    {overall.profitMarginPercent.toFixed(1)} %
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-gray-600">سود تومانی نسبت به بازار</div>
                  <div className="font-bold text-teal-700">
                    {overall.marginVsMarketPercent.toFixed(1)} %
                  </div>
                </div>

                <div className="col-span-full mt-3 pt-3 border-t border-gray-200 text-center">
                  <div className="text-base font-semibold text-gray-700 mb-1">
                    حاشیه سود در رقابت با بازار
                  </div>
                  <div
                    className={`text-2xl text-[#212a72] font-extrabold ${overall.marginVsMarketPercent > 0 ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {overall.marginVsMarketPercent.toFixed(1)} %
                  </div>
                  <div className="mt-2 text-lg font-bold text-[#212a72]">{decision}</div>
                </div>

                <div className="col-span-full mt-6 flex flex-wrap gap-3 justify-center">
                  <Button
                    onClick={exportToPDF}
                    disabled={isExporting}
                    className="px-5 py-2.5 cursor-pointer bg-[#212a72] text-white rounded-lg hover:bg-[#1a1f5a] transition font-medium flex items-center gap-2 shadow-sm min-w-[140px]"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        در حال آماده‌سازی...
                      </>
                    ) : (
                      'دانلود PDF'
                    )}
                  </Button>

                  <Button
                    onClick={exportToPNG}
                    disabled={isExporting}
                    variant="secondary"
                    className="px-5 py-2.5 bg-gray-700 cursor-pointer text-white rounded-lg hover:bg-gray-800 transition font-medium flex items-center gap-2 shadow-sm min-w-[140px]"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        در حال آماده‌سازی...
                      </>
                    ) : (
                      'دانلود تصویر PNG'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// 'use client'

// import { Button } from '@/components/ui/button'
// import {
//   Dialog,
//   DialogContent,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog'
// import { Input } from '@/components/ui/input'
// import type { ProductLink, Setting } from '@/payload-types'
// import { useState } from 'react'
// import { BsFillBasketFill } from 'react-icons/bs'
// import BasketProductButton from './BasketProduct'

// type BasketItem = ProductLink & {
//   quantity: number
//   purchasePriceUSD: number
// }

// interface BasketDialogProps {
//   usd: number | null
//   aed: number | null
// }

// export default function BasketProductsDialog({ usd, aed }: BasketDialogProps) {
//   const [items, setItems] = useState<BasketItem[]>([])
//   const [loading, setLoading] = useState(false)

//   // You can later move this to context / API / user setting
//   const USD_TO_TOMAN = usd || 0 // approximate Feb 2026 free market rate
//   const AED_TO_Toman = aed || 0
//   const loadProducts = async () => {
//     setLoading(true)
//     try {
//       const res = await fetch('/api/custom/basket')
//       const json = await res.json()
//       const enriched = (json.data ?? []).map((p: ProductLink) => ({
//         ...p,
//         quantity: 1,
//         purchasePriceUSD: 0, // default → user should fill it
//       }))
//       setItems(enriched)
//     } catch (err) {
//       console.error('Failed to load basket', err)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const updateQuantity = (productId: string, newQty: number) => {
//     if (newQty < 1) newQty = 1
//     setItems((prev) =>
//       prev.map((item) => (item.id === productId ? { ...item, quantity: newQty } : item)),
//     )
//   }

//   const updatePurchasePrice = (productId: string, value: string) => {
//     const num = parseFloat(value) || 0
//     setItems((prev) =>
//       prev.map((item) => (item.id === productId ? { ...item, purchasePriceUSD: num } : item)),
//     )
//   }

//   const removeItem = (productId: string) => {
//     setItems((prev) => prev.filter((item) => item.id !== productId))
//   }

//   const totalToman = items.reduce((sum, item) => {
//     const costToman = item.purchasePriceUSD * USD_TO_TOMAN
//     return sum + costToman * item.quantity
//   }, 0)

//   return (
//     <Dialog onOpenChange={(open) => open && loadProducts()}>
//       <DialogTrigger asChild>
//         <Button
//           variant="outline"
//           className="rounded-lg shadow-none cursor-pointer hover:-translate-y-1 duration-100 border-none bg-white text-[#212a72]"
//         >
//           <BsFillBasketFill />
//         </Button>
//       </DialogTrigger>

//       <DialogContent className="max-h-[85vh] max-w-8xl overflow-y-auto p-6">
//         <DialogHeader className="mb-6">
//           <DialogTitle className="text-xl font-bold text-[#212a72]">سبد خرید</DialogTitle>
//         </DialogHeader>

//         {loading && (
//           <div className="my-20 flex flex-col items-center gap-4 text-sm text-gray-500">
//             <div className="h-14 w-14 animate-spin rounded-full border-4 border-gray-300 border-t-[#212a72]" />
//             در حال بارگذاری سبد ...
//           </div>
//         )}

//         {!loading && items.length === 0 && (
//           <div className="my-24 flex flex-col items-center gap-4 text-sm text-gray-500">
//             <BsFillBasketFill className="h-12 w-12 text-gray-300" />
//             <p>هیچ محصولی در سبد خرید وجود ندارد</p>
//           </div>
//         )}

//         {!loading && items.length > 0 && (
//           <>
//             <div className="space-y-4">
//               {items.map((p) => {
//                 const marketPrice = Number(p.lowestPrice) || 0
//                 const buyPriceToman = p.purchasePriceUSD * USD_TO_TOMAN
//                 const lineTotal = buyPriceToman * p.quantity

//                 return (
//                   <div
//                     key={p.id}
//                     className="flex flex-wrap sm:flex-nowrap gap-3 items-center justify-between p-4 bg-white rounded-lg border-none hover:shadow-sm transition-all duration-150"
//                   >
//                     {/* Remove / actions */}
//                     <div className="flex items-center gap-2 shrink-0">
//                       <BasketProductButton
//                         productId={p.id}
//                         initialDisabled={true}
//                         onHide={() => removeItem(p.id)}
//                       />
//                     </div>

//                     {/* Product name */}
//                     <div className="flex">
//                       <span className="font-medium text-[#212a72]">{p.name}</span>
//                     </div>

//                     {/* خرید (USD input) */}
//                     <div className="flex flex-col gap-2 max-w-20">
//                       <span className="text-xs text-gray-600">قیمت خرید ($)</span>
//                       <Input
//                         type="number"
//                         min="0"
//                         step="0.01"
//                         value={p.purchasePriceUSD || ''}
//                         onChange={(e) => updatePurchasePrice(p.id, e.target.value)}
//                         placeholder="0.00"
//                         className="text-center px-2 no-spin border-none bg-[#e6f3ff]"
//                       />
//                     </div>

//                     {/* Quantity */}
//                     <div className="w-24 flex flex-col gap-1 max-w-20">
//                       <span className="text-xs text-gray-600">تعداد</span>
//                       <Input
//                         type="number"
//                         min="1"
//                         value={p.quantity}
//                         onChange={(e) => {
//                           const val = parseInt(e.target.value) || 1
//                           updateQuantity(p.id, val)
//                         }}
//                         className="text-center no-spin border-none bg-[#e6f3ff]"
//                       />
//                     </div>

//                     {/* Converted buy price in Toman */}
//                     <div className="flex flex-col gap-2 max-w-20">
//                       <span className="text-xs text-gray-600">قیمت خرید (T)</span>
//                       <span className="font-medium text-[#212a72]">
//                         {buyPriceToman.toLocaleString('fa-IR')}
//                       </span>
//                     </div>

//                     {/* Market / lowest price (reference) */}
//                     <div className="flex flex-col justify-center items-center gap-2 min-w-36">
//                       <span className="text-xs text-gray-500">پایین‌ترین قیمت بازار</span>
//                       <span className="font-medium text-gray-700">
//                         {marketPrice.toLocaleString('fa-IR')}
//                       </span>
//                     </div>

//                     {/* Line total */}
//                     <div className="items-center justify-center flex flex-col gap-2 text-right font-medium text-[#212a72]">
//                       <div className="text-sm text-gray-500">جمع</div>
//                       {lineTotal.toLocaleString('fa-IR')}
//                     </div>
//                   </div>
//                 )
//               })}
//             </div>

//             {/* Grand total */}
//             <div className="mt-8 pt-6 border-t border-gray-200">
//               <div className="flex justify-between items-center text-xl">
//                 <span className="font-semibold text-[#212a72]">جمع کل (تومان):</span>
//                 <span className="font-bold text-2xl text-[#212a72]">
//                   {totalToman.toLocaleString('fa-IR')} تومان
//                 </span>
//               </div>

//               {/* Optional: show in USD too */}
//               <div className="text-right text-sm text-gray-500 mt-1">
//                 ≈{' '}
//                 {(totalToman / USD_TO_TOMAN).toLocaleString('en-US', {
//                   maximumFractionDigits: 2,
//                 })}{' '}
//                 USD
//               </div>
//             </div>
//           </>
//         )}
//       </DialogContent>
//     </Dialog>
//   )
// }
