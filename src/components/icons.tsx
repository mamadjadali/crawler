import * as React from 'react'
import { Loader2 } from 'lucide-react'

export const Icons = {
  spinner: Loader2,
}

type IconProps = {
  className?: string
}

export const Dirham: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={className}
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8.5 19h-3.5" />
      <path d="M8.599 16.479a1.5 1.5 0 1 0 -1.099 2.521" />
      <path d="M7 4v9" />
      <path d="M15 13h1.888a1.5 1.5 0 0 0 1.296 -2.256l-2.184 -3.744" />
      <path d="M11 13.01v-.01" />
    </svg>
  )
}
