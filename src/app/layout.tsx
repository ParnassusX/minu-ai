import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { GalleryProvider } from '@/contexts/GalleryContext'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Toaster } from '@/components/ui/toaster'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Minu.AI - AI Image Generation Platform',
  description: 'Create stunning images with FLUX AI technology',
  keywords: ['AI', 'image generation', 'FLUX', 'artificial intelligence'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <GalleryProvider>
                {children}
              </GalleryProvider>
            </AuthProvider>
            <Toaster />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
