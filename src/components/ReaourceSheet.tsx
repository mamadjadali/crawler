'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Resource } from '@/payload-types'
import { AppWindow, BellDot } from 'lucide-react'
import { Card } from './ui/card'
import { toSiteKey, getSiteLabel, getSiteClass } from '@/lib/utils/site'

interface ResourceSheetProps {
  resource: Resource
}

export default function ResourceSheet({ resource }: ResourceSheetProps) {
  const source = resource.site ?? []

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="border-gray-300 rounded-lg cursor-pointer w-auto shadow-none"
        >
          <AppWindow className="size-4.5 text-neutral-500" />
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className=" bg-[#141414] p-6 items-center">
        <SheetHeader>
          <SheetTitle className="text-white">منـابعـ</SheetTitle>
        </SheetHeader>

        <Card className="border-none shadow-none grid grid-cols-3 justify-center items-center gap-6">
          {source.length === 0 && (
            <p className="text-sm text-muted-foreground">منـابعـ وجود ندارد.</p>
          )}

          {source.map((item) => {
            const siteKey = toSiteKey(item.title)
            const label = siteKey ? getSiteLabel(siteKey) : null
            const badgeClass = siteKey ? getSiteClass(siteKey) : ''

            return (
              <div key={item.id ?? item.title} className="">
                {siteKey && <span className={badgeClass}>{label}</span>}
              </div>
            )
          })}
        </Card>
      </SheetContent>
    </Sheet>
  )
}
