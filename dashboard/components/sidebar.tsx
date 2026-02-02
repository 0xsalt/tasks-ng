"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageSquare, Upload, FileText, Table, Target, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { SyncStatus } from "@/components/sync-status"

interface FileNav {
  name: string
  slug: string
  href: string
  isCSV: boolean
}

const staticNavigation = [
  { name: "Overview", href: "/", icon: Home },
  { name: "Sprint", href: "/sprint", icon: Calendar },
  { name: "Backlog", href: "/progress", icon: FileText },
  { name: "Strategy", href: "/strategy", icon: Target },
  { name: "Specification", href: "/file/SPEC", icon: FileText },
  { name: "Ideas", href: "/file/IDEAS", icon: FileText },
  { name: "Ask", href: "/ask", icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()
  const [fileCount, setFileCount] = useState(0)
  const [files, setFiles] = useState<string[]>([])
  const [fileNavigation, setFileNavigation] = useState<FileNav[]>([])

  const fetchFileCount = () => {
    fetch('/api/files/count')
      .then(res => res.json())
      .then(data => {
        setFileCount(data.count)
        setFiles(data.files)

        // Build file navigation
        const navItems: FileNav[] = data.files.map((filename: string) => {
          const isCSV = filename.endsWith('.csv')
          // Strip extension and directory prefixes (docs/, data/) for URL-friendly slug
          const slug = filename
            .replace('.md', '')
            .replace('.csv', '')
            .replace('docs/', '')
            .replace('data/', '')
          return {
            name: slug,
            slug,
            href: `/file/${slug}`,
            isCSV
          }
        })
        setFileNavigation(navItems)
      })
      .catch(err => console.error('Failed to fetch file count:', err))
  }

  useEffect(() => {
    // Initial fetch
    fetchFileCount()

    // Listen for file upload events
    const handleFileUploaded = () => {
      fetchFileCount()
    }

    window.addEventListener('telosFileUploaded', handleFileUploaded)

    return () => {
      window.removeEventListener('telosFileUploaded', handleFileUploaded)
    }
  }, [])

  return (
    <div className="flex h-screen w-64 flex-col fixed left-0 top-0 bg-gradient-to-b from-[#1a759f]/5 to-[#1e6091]/5 dark:from-[#1a759f]/10 dark:to-[#1e6091]/10 dark:bg-[var(--card-bg)] border-r dark:border-[var(--card-border)]">
      <div className="flex h-16 items-center px-6 border-b dark:border-[var(--card-border)]">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1a759f] to-[#1e6091] dark:from-[#38bdf8] dark:to-[#60a5fa] bg-clip-text text-transparent">
          tasks-ng
        </h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {/* Static Navigation */}
        {staticNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all",
                isActive
                  ? "bg-[#1a759f] dark:bg-[#38bdf8] text-white shadow-lg shadow-[#1a759f]/20 dark:shadow-[#38bdf8]/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-[#1a759f] dark:hover:text-[#38bdf8] hover:shadow-sm"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-[#1a759f] dark:group-hover:text-[#38bdf8]"
                )}
              />
              {item.name}
            </Link>
          )
        })}

        {/* Divider */}
        {fileNavigation.length > 0 && (
          <div className="border-t dark:border-[var(--card-border)] my-2 pt-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 mb-2 flex items-center justify-between">
              <span>TELOS FILES</span>
              <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px]">
                {fileCount}
              </Badge>
            </div>
          </div>
        )}

        {/* Dynamic File Navigation */}
        {fileNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.slug}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all",
                isActive
                  ? "bg-[#1a759f] dark:bg-[#38bdf8] text-white shadow-lg shadow-[#1a759f]/20 dark:shadow-[#38bdf8]/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-[#1a759f] dark:hover:text-[#38bdf8] hover:shadow-sm"
              )}
            >
              {item.isCSV ? (
                <Table
                  className={cn(
                    "mr-3 h-4 w-4 flex-shrink-0 transition-colors",
                    isActive ? "text-white" : "text-[#76c893] dark:text-[#4ade80] group-hover:text-[#1a759f] dark:group-hover:text-[#38bdf8]"
                  )}
                />
              ) : (
                <FileText
                  className={cn(
                    "mr-3 h-4 w-4 flex-shrink-0 transition-colors",
                    isActive ? "text-white" : "text-[#1a759f] dark:text-[#38bdf8] group-hover:text-[#1a759f] dark:group-hover:text-[#38bdf8]"
                  )}
                />
              )}
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sync Status */}
      <div className="border-t dark:border-[var(--card-border)] p-3">
        <SyncStatus />
      </div>

      <div className="border-t dark:border-[var(--card-border)] p-3">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Task Format Specification
          <div className="mt-1 font-semibold text-[#1a759f] dark:text-[#38bdf8]">v2.0.0</div>
        </div>
      </div>
    </div>
  )
}
