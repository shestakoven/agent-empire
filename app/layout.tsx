import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agent Empire - AI Agents That Make Money',
  description: 'Create AI agents that trade crypto, build social media followings, and earn money 24/7 while you sleep. The future of work is here.',
  keywords: ['AI agents', 'crypto trading', 'passive income', 'automation', 'AI', 'blockchain'],
  authors: [{ name: 'Agent Empire' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0ea5e9',
  openGraph: {
    title: 'Agent Empire - AI Agents That Make Money',
    description: 'Replace your job with AI agents that make money while you sleep',
    type: 'website',
    url: 'https://agent-empire.com',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Agent Empire - AI Agents That Make Money',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agent Empire - AI Agents That Make Money',
    description: 'Replace your job with AI agents that make money while you sleep',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="min-h-screen bg-dark-900 text-white antialiased">
        {children}
      </body>
    </html>
  )
}