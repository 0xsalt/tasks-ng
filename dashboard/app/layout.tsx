import type { Metadata, Viewport } from "next"
import "./globals.css"
import { Sidebar } from "../components/sidebar"
import { MobileNav } from "../components/mobile-nav"
import { QuickCapture } from "../components/quick-capture"
import { ThemeProvider } from "./context/ThemeContext"
import { ThemeToggle } from "./components/ThemeToggle"

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
  themeColor: "#1a759f",
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
      <body className="bg-gray-50 dark:bg-gray-900">
        <ThemeProvider>
          {/* Theme toggle - positioned top-right */}
          <div className="fixed top-2 right-2 z-50 lg:top-4 lg:right-4">
            <ThemeToggle />
          </div>

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
        </ThemeProvider>
      </body>
    </html>
  )
}
