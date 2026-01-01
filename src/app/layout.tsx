import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Web2App Studio - Turn Any Website Into a Native Mac App',
  description: 'Create native macOS apps from any website. No coding required. Features include notifications, menu bar mode, ad blocking, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
