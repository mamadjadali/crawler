"use client"

import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatPrice, formatDate } from "@/lib/utils/formatPrice"

interface PriceHistoryItem {
  price: number
  crawledAt: string | Date
}

interface PriceHistoryChartProps {
  priceHistory: PriceHistoryItem[]
}

export const description = "A bar chart with price history"

const chartConfig = {
  price: {
    label: "قیمت",
    color: "hsl(217, 91%, 60%)",
  },
  label: {
    color: "var(--background)",
  },
} satisfies ChartConfig

export function PriceHistoryChart({ priceHistory }: PriceHistoryChartProps) {
  // Transform price history data for chart
  const chartData = priceHistory
    .map((item, index) => {
      // Parse the date - handle both string and Date object
      let dateObj: Date
      if (typeof item.crawledAt === 'string') {
        dateObj = new Date(item.crawledAt)
      } else if (item.crawledAt instanceof Date) {
        dateObj = item.crawledAt
      } else {
        dateObj = new Date()
      }
      
      // Ensure date is valid
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date()
      }
      
      // Format date with full time precision (hour, minute, second, millisecond)
      const formattedDate = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(dateObj)
      
      // Always show milliseconds to differentiate entries
      const milliseconds = dateObj.getMilliseconds()
      const dateWithMs = `${formattedDate}.${String(milliseconds).padStart(3, '0')}`
      return {
        date: dateWithMs,
        price: item.price,
        shortDate: formattedDate.split(' ')[0] || formattedDate,
        timestamp: dateObj.getTime(), // Keep original timestamp for sorting
        originalDate: dateObj, // Keep original date object
        crawledAt: item.crawledAt, // Keep original crawledAt value for tooltip (same as list uses)
      }
    })
    .sort((a, b) => a.timestamp - b.timestamp)

  if (chartData.length === 0) {
    return null
  }

  return (
    <Card className="border border-gray-400">
      <CardHeader className="p-4">
        <CardTitle>نمودار قیمت</CardTitle>
        <CardDescription>تاریخچه قیمت محصول</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              right: 16,
            }}
            barCategoryGap="5%"
          >
            <YAxis
              dataKey="shortDate"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 10)}
              hide
            />
            <XAxis dataKey="price" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="text-white bg-[#0a0a0a] border border-gray-400"
                  indicator="line"
                  hideLabel={false}
                  labelFormatter={(value, payload) => {
                    if (payload && payload[0]?.payload) {
                      // Show only date (no time) in tooltip
                      const crawledAt = payload[0].payload.crawledAt
                      if (crawledAt) {
                        const date = typeof crawledAt === 'string' ? new Date(crawledAt) : crawledAt
                        return new Intl.DateTimeFormat('fa-IR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        }).format(date)
                      }
                      return payload[0].payload.date
                    }
                    return value
                  }}
                  formatter={(value, name, item, index, payload) => {
                    // Format price exactly like the list does
                    const price = formatPrice(value as number, true)
                    // Show only date (no time) in tooltip
                    const crawledAt = item?.payload?.crawledAt
                    let date = ''
                    if (crawledAt) {
                      const dateObj = typeof crawledAt === 'string' ? new Date(crawledAt) : crawledAt
                      date = new Intl.DateTimeFormat('fa-IR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }).format(dateObj)
                    }
                    return (
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">{price}</div>
                        {date && <div className="text-xs text-gray-400">{date}</div>}
                      </div>
                    )
                  }}
                />
              }
            />
            <Bar
              dataKey="price"
              fill="var(--color-price)"
              radius={4}
              barSize={30}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 mb-4 text-sm">
        {chartData.length > 1 && (() => {
          const firstPrice = chartData[0].price
          const lastPrice = chartData[chartData.length - 1].price
          const priceChange = lastPrice - firstPrice
          const percentageChange = firstPrice > 0 ? ((priceChange / firstPrice) * 100) : 0
          const isIncrease = priceChange > 0
          const isDecrease = priceChange < 0
          
          return (
            <div className="flex gap-2 leading-none font-medium">
              {isIncrease && (
                <>
                  افزایش: {formatPrice(Math.abs(priceChange), true)} ({new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(percentageChange))}%)
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </>
              )}
              {isDecrease && (
                <>
                  کاهش: {formatPrice(Math.abs(priceChange), true)} ({new Intl.NumberFormat('fa-IR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(percentageChange))}%)
                  <TrendingUp className="h-4 w-4 rotate-180 text-red-500" />
                </>
              )}
              {!isIncrease && !isDecrease && (
                <>
                  بدون تغییر
                </>
              )}
            </div>
          )
        })()}
        <div className="text-muted-foreground leading-none">
          {new Intl.NumberFormat('fa-IR').format(chartData.length)} رکورد قیمت
        </div>
      </CardFooter>
    </Card>
  )
}
