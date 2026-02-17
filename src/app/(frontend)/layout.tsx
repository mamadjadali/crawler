import React from 'react'
import './styles.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  description: '',
  title: 'Ara',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json"></link>
      </head>
      <body className="">
        {/* <Providers> */}
        {/* <ThemeProvider> */}
        <main>{children}</main>
        {/* </ThemeProvider> */}
        {/* </Providers> */}
      </body>
    </html>
  )
}
