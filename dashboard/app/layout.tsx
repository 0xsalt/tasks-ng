import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Sidebar } from "../components/sidebar"
import { MobileNav } from "../components/mobile-nav"
import { QuickCapture } from "../components/quick-capture"

export const metadata: Metadata = {
  title: "tasks-ng",
  description: "Task management with quick capture",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "tasks-ng",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: "#4a6fa5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="bg-gray-50">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Main content - full width on mobile, offset on desktop */}
        <main className="lg:pl-64 pb-20 lg:pb-0">
          <div className="min-h-screen">
            {children}
          </div>
        </main>

        {/* Mobile bottom navigation - hidden on desktop */}
        <MobileNav />

        {/* Quick capture FAB - visible on mobile */}
        <QuickCapture />
      </body>
    </html>
  )
}
