import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '@/public/assets/styles/globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import SwrProvider from '@/components/providers/swr-provider'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'KmaERM',
  description: 'Trang quản lý doanh nghiệp KMA',
  icons: {
    icon: '/assets/images/logo.png'
  }
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='vi' suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <SwrProvider>
            {children}
            <Toaster expand={true} />
          </SwrProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
