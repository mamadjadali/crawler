'use client'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Changelog } from '@/payload-types'
import { BiSolidBellRing } from 'react-icons/bi'
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
          className="bg-[#E6F3FF] border-none rounded-lg cursor-pointer w-auto shadow-none"
        >
          <BiSolidBellRing className="size-4.5 text-[#212A72]" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-95 sm:w-105 bg-[#E6F3FF] p-6">
        <SheetHeader>
          <SheetTitle className="text-[#212A72]">تغییراتــ</SheetTitle>
        </SheetHeader>

        <ScrollArea dir="rtl" className="border-none shadow-none h-[90vh] sm:h-[80vh]">
          {logs.length === 0 && (
            <p className="text-sm text-muted-foreground">تغییراتــی وجود ندارد.</p>
          )}

          {logs.map((item) => (
            <div key={item.id ?? item.title} className="p-3 mb-2 bg-white rounded-xl">
              {item.date && (
                <span className="text-sm text-gray-600">
                  {new Date(item.date).toLocaleDateString('fa-IR', {
                    year: 'numeric',
                    month: 'long', // → بهمن
                    day: 'numeric',
                    // weekday: 'long', // → دوشنبه (optional)
                  })}
                </span>
              )}
              <h4 className="text-sm text-[#212A72] font-semibold ">{item.title}</h4>

              {item.description && (
                <p className="text-sm text-justify text-gray-500 whitespace-pre-line">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
