import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Providers from './providers'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Michelin Social',
  description: 'Découvrez, partagez, et vivez les meilleures expériences Michelin',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-neutral-950 text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
