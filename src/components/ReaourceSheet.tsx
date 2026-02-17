'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { getSiteClass, getSiteLabel, toSiteKey } from '@/lib/utils/site'
import { Resource } from '@/payload-types'
import { FaSpider } from 'react-icons/fa'
import { Card } from './ui/card'
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
          className="bg-[#E6F3FF] border-none rounded-lg cursor-pointer w-auto shadow-none"
        >
          <FaSpider className="size-4.5 text-[#212A72]" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className=" bg-[#E6F3FF] p-6 items-center data-[state=open]:animate-in"
      >
        <SheetHeader>
          <SheetTitle className="text-[#212A72]">منـابعـ</SheetTitle>
        </SheetHeader>

        <Card className="border-none shadow-none grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 justify-center items-center gap-6">
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
