import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import Providers from './providers'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './globals.css'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'FoodTok - Expériences culinaires',
  description: 'Découvrez et partagez les meilleures expériences gastronomiques',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FoodTok',
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
    <html lang="fr" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-[family-name:var(--font-geist-sans)] antialiased bg-white dark:bg-black text-gray-900 dark:text-white transition-colors`}>
        <Providers>
          {children}
          
          {/* Toast Container pour les notifications */}
          <ToastContainer
            position="top-center"
            autoClose={3000}
            hideProgressBar={true}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
            style={{
              borderRadius: '5px',
            }}
            toastStyle={{
              borderRadius: '12px',
              fontFamily: 'var(--font-geist-sans)',
              fontSize: '14px',
            }}
          />
        </Providers>
      </body>
    </html>
  )
}