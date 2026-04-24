import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Providers from './providers'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Michelin',
  description: 'Vivez les meilleures expériences Michelin',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Michelin',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} font-[family-name:var(--font-geist-sans)] antialiased bg-black text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
