import React from 'react'
import './styles.css'

export const metadata = {
  description: '',
  title: 'Ara',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="fa" dir="rtl">
      <body>
        {/* <Providers> */}
        {/* <ThemeProvider> */}
        <main>{children}</main>
        {/* </ThemeProvider> */}
        {/* </Providers> */}
      </body>
    </html>
  )
}
