"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ListTodo, Target, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Tasks", href: "/progress", icon: ListTodo },
  { name: "Matrix", href: "/matrix", icon: Target },
]

export function MobileNav() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {/* Bottom navigation bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[var(--card-bg)] border-t border-gray-200 dark:border-[var(--card-border)] z-40 safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full min-w-[64px] py-2 transition-colors touch-manipulation",
                  isActive
                    ? "text-[#1a759f] dark:text-[#38bdf8]"
                    : "text-gray-500 dark:text-gray-400 active:text-[#1a759f] dark:active:text-[#38bdf8]"
                )}
              >
                <item.icon className={cn("h-6 w-6 mb-1", isActive && "stroke-[2.5px]")} />
                <span className={cn("text-xs font-medium", isActive && "font-semibold")}>
                  {item.name}
                </span>
              </Link>
            )
          })}

          {/* Menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col items-center justify-center flex-1 h-full min-w-[64px] py-2 text-gray-500 dark:text-gray-400 active:text-[#1a759f] dark:active:text-[#38bdf8] touch-manipulation"
          >
            <Menu className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Slide-up menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu panel */}
          <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white dark:bg-[var(--card-bg)] rounded-t-2xl z-50 max-h-[60vh] overflow-y-auto animate-slide-up">
            <div className="p-4 border-b dark:border-[var(--card-border)]">
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Navigation</h2>
            </div>
            <div className="p-2">
              <Link
                href="/file/SPEC"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 p-4 rounded-lg active:bg-gray-100 dark:active:bg-gray-700 touch-manipulation"
              >
                <span className="text-gray-900 dark:text-gray-100">Specification</span>
              </Link>
              <Link
                href="/file/IDEAS"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 p-4 rounded-lg active:bg-gray-100 dark:active:bg-gray-700 touch-manipulation"
              >
                <span className="text-gray-900 dark:text-gray-100">Ideas</span>
              </Link>
              <Link
                href="/ask"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 p-4 rounded-lg active:bg-gray-100 dark:active:bg-gray-700 touch-manipulation"
              >
                <span className="text-gray-900 dark:text-gray-100">Ask AI</span>
              </Link>
            </div>
            <div className="p-4 border-t dark:border-[var(--card-border)] text-center text-xs text-gray-500 dark:text-gray-400">
              tasks-ng v2.0.0
            </div>
          </div>
        </>
      )}
    </>
  )
}
