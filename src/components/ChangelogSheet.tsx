'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Changelog } from '@/payload-types'
import { BellDot } from 'lucide-react'
import { ScrollArea } from './ui/scroll-area'

interface ChangelogSheetProps {
  changelog: Changelog
}

export default function ChangelogSheet({ changelog }: ChangelogSheetProps) {
  const logs = changelog.log ?? []

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="border-gray-300 rounded-lg cursor-pointer w-auto shadow-none"
        >
          <BellDot className="size-4.5 text-neutral-500" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-95 sm:w-105 bg-white p-6">
        <SheetHeader>
          <SheetTitle>تغییراتــ</SheetTitle>
        </SheetHeader>

        <ScrollArea dir="rtl" className="border-none shadow-none h-[70vh] sm:h-[80vh]">
          {logs.length === 0 && (
            <p className="text-sm text-muted-foreground">تغییراتــی وجود ندارد.</p>
          )}

          {logs.map((item) => (
            <div key={item.id ?? item.title} className="p-3 mb-2 border border-gray-300 rounded-xl">
              <h4 className="text-sm text-neutral-700 font-semibold ">{item.title}</h4>

              {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
            </div>
          ))}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
