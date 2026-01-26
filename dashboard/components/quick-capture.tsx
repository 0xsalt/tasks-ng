"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, X, Send, Loader2, Check, Zap, Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type QuickModifier = "urgent" | "important" | "none"

export function QuickCapture() {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState("")
  const [modifier, setModifier] = useState<QuickModifier>("none")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset success state after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false)
        setIsOpen(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Build modifiers array
      const modifiers: string[] = []
      if (modifier === "urgent") modifiers.push("urgent")
      if (modifier === "important") modifiers.push("important")
      if (modifier === "urgent" || modifier === "important") {
        // Q1 gets both
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: value.trim(),
          section: "NOW",
          modifiers,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create task")
      }

      // Success!
      setValue("")
      setModifier("none")
      setSuccess(true)

      // Trigger refetch on main page
      window.dispatchEvent(new CustomEvent("taskCreated"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* FAB Button - positioned above bottom nav on mobile, bottom-right on desktop */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed z-50 flex items-center justify-center rounded-full bg-[#1a759f] text-white shadow-lg shadow-[#1a759f]/30 transition-all active:scale-95 touch-manipulation",
          "lg:bottom-6 lg:right-6 lg:h-14 lg:w-14",
          "bottom-24 right-4 h-16 w-16" // Mobile: larger, above bottom nav
        )}
        aria-label="Quick add task"
      >
        <Plus className="h-8 w-8 lg:h-6 lg:w-6" />
      </button>

      {/* Modal overlay and input */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !isSubmitting && setIsOpen(false)}
          />

          {/* Input modal - bottom sheet on mobile, centered on desktop */}
          <div className={cn(
            "fixed z-50 bg-white",
            "lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-xl lg:w-[480px] lg:max-w-[90vw]",
            "bottom-0 left-0 right-0 rounded-t-2xl animate-slide-up safe-area-inset-bottom"
          )}>
            {/* Handle bar (mobile) */}
            <div className="lg:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="h-5 w-5 text-[#1a759f]" />
                Quick Capture
              </h2>
              <button
                onClick={() => !isSubmitting && setIsOpen(false)}
                className="p-2 -mr-2 text-gray-500 active:text-gray-900 touch-manipulation"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success state */}
            {success ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <Check className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-lg font-medium text-gray-900">Task added!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Input */}
                <div className="p-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full text-lg px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1a759f] focus:ring-2 focus:ring-[#1a759f]/20 outline-none transition-all"
                    disabled={isSubmitting}
                    autoComplete="off"
                    autoCorrect="off"
                    enterKeyHint="send"
                  />

                  {/* Error message */}
                  {error && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </p>
                  )}
                </div>

                {/* Quick modifiers */}
                <div className="px-4 pb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Priority</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setModifier(modifier === "urgent" ? "none" : "urgent")}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl font-medium transition-all touch-manipulation",
                        modifier === "urgent"
                          ? "bg-red-100 text-red-700 border-2 border-red-300"
                          : "bg-gray-100 text-gray-600 border-2 border-transparent active:bg-gray-200"
                      )}
                    >
                      <Zap className="h-4 w-4 inline mr-1" />
                      Urgent
                    </button>
                    <button
                      type="button"
                      onClick={() => setModifier(modifier === "important" ? "none" : "important")}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl font-medium transition-all touch-manipulation",
                        modifier === "important"
                          ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
                          : "bg-gray-100 text-gray-600 border-2 border-transparent active:bg-gray-200"
                      )}
                    >
                      <Clock className="h-4 w-4 inline mr-1" />
                      Important
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="p-4 border-t">
                  <button
                    type="submit"
                    disabled={!value.trim() || isSubmitting}
                    className={cn(
                      "w-full py-4 rounded-xl font-semibold text-white transition-all touch-manipulation flex items-center justify-center gap-2",
                      value.trim() && !isSubmitting
                        ? "bg-[#1a759f] active:bg-[#2463c0]"
                        : "bg-gray-300 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Add to NOW
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </>
  )
}
