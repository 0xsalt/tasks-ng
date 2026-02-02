"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, X, Send, Loader2, Check, Zap, Clock, AlertTriangle, Brain, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

type QuickModifier = "urgent" | "important" | "none"
type CaptureMode = "task" | "braindump"

export function QuickCapture() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<CaptureMode>("task")
  const [value, setValue] = useState("")
  const [modifier, setModifier] = useState<QuickModifier>("none")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (mode === "task" && inputRef.current) {
          inputRef.current.focus()
        } else if (mode === "braindump" && textareaRef.current) {
          textareaRef.current.focus()
        }
      }, 100)
    }
  }, [isOpen, mode])

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

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Build modifiers array
      const modifiers: string[] = []
      if (modifier === "urgent") modifiers.push("urgent")
      if (modifier === "important") modifiers.push("important")

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
      setSuccessMessage("Task added!")
      setSuccess(true)

      // Trigger refetch on main page
      window.dispatchEvent(new CustomEvent("taskCreated"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitBrainDump = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: value.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add to inbox")
      }

      // Success!
      setValue("")
      setSuccessMessage("Added to Inbox!")
      setSuccess(true)

      // Trigger refetch on main page
      window.dispatchEvent(new CustomEvent("taskCreated"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = mode === "task" ? handleSubmitTask : handleSubmitBrainDump

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
            "fixed z-50 bg-white dark:bg-[var(--card-bg)]",
            "lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-xl lg:w-[480px] lg:max-w-[90vw]",
            "bottom-0 left-0 right-0 rounded-t-2xl animate-slide-up safe-area-inset-bottom"
          )}>
            {/* Handle bar (mobile) */}
            <div className="lg:hidden w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-3" />

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-[var(--card-border)]">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {mode === "task" ? (
                  <>
                    <Zap className="h-5 w-5 text-[#1a759f] dark:text-[#38bdf8]" />
                    Quick Capture
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                    Brain Dump
                  </>
                )}
              </h2>
              <button
                onClick={() => !isSubmitting && setIsOpen(false)}
                className="p-2 -mr-2 text-gray-500 dark:text-gray-400 active:text-gray-900 dark:active:text-gray-100 touch-manipulation"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="px-4 pt-4">
              <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode("task")}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all touch-manipulation flex items-center justify-center gap-2",
                    mode === "task"
                      ? "bg-white dark:bg-gray-800 text-[#1a759f] dark:text-[#38bdf8] shadow"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Task
                </button>
                <button
                  type="button"
                  onClick={() => setMode("braindump")}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all touch-manipulation flex items-center justify-center gap-2",
                    mode === "braindump"
                      ? "bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow"
                      : "text-gray-500 dark:text-gray-400"
                  )}
                >
                  <Brain className="h-4 w-4" />
                  Brain Dump
                </button>
              </div>
            </div>

            {/* Success state */}
            {success ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center mb-4",
                  mode === "task" ? "bg-green-100 dark:bg-green-900/30" : "bg-purple-100 dark:bg-purple-900/30"
                )}>
                  <Check className={cn(
                    "h-8 w-8",
                    mode === "task" ? "text-green-600 dark:text-green-400" : "text-purple-600 dark:text-purple-400"
                  )} />
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{successMessage}</p>
              </div>
            ) : mode === "task" ? (
              // Task Mode Form
              <form onSubmit={handleSubmit}>
                {/* Input */}
                <div className="p-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full text-lg px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-[#1a759f] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-[#1a759f]/20 dark:focus:ring-[#38bdf8]/20 outline-none transition-all"
                    disabled={isSubmitting}
                    autoComplete="off"
                    autoCorrect="off"
                    enterKeyHint="send"
                  />

                  {/* Error message */}
                  {error && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </p>
                  )}
                </div>

                {/* Quick modifiers */}
                <div className="px-4 pb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Priority</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setModifier(modifier === "urgent" ? "none" : "urgent")}
                      className={cn(
                        "flex-1 py-3 px-4 rounded-xl font-medium transition-all touch-manipulation",
                        modifier === "urgent"
                          ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-2 border-red-300 dark:border-red-700"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent active:bg-gray-200 dark:active:bg-gray-600"
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
                          ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-2 border-yellow-300 dark:border-yellow-700"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-2 border-transparent active:bg-gray-200 dark:active:bg-gray-600"
                      )}
                    >
                      <Clock className="h-4 w-4 inline mr-1" />
                      Important
                    </button>
                  </div>
                </div>

                {/* Submit button */}
                <div className="p-4 border-t dark:border-[var(--card-border)]">
                  <button
                    type="submit"
                    disabled={!value.trim() || isSubmitting}
                    className={cn(
                      "w-full py-4 rounded-xl font-semibold text-white transition-all touch-manipulation flex items-center justify-center gap-2",
                      value.trim() && !isSubmitting
                        ? "bg-[#1a759f] dark:bg-[#38bdf8] active:bg-[#1e6091] dark:active:bg-[#0ea5e9]"
                        : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
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
            ) : (
              // Brain Dump Mode Form
              <form onSubmit={handleSubmit}>
                {/* Textarea for brain dump */}
                <div className="p-4">
                  <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Dump your thoughts here... Ideas, notes, random things you need to capture. Process later."
                    className="w-full text-base px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 outline-none transition-all resize-none"
                    rows={4}
                    disabled={isSubmitting}
                    autoComplete="off"
                    autoCorrect="off"
                  />

                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    Raw text saved to INBOX section. No validation - just capture now, process later.
                  </p>

                  {/* Error message */}
                  {error && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      {error}
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <div className="p-4 border-t dark:border-[var(--card-border)]">
                  <button
                    type="submit"
                    disabled={!value.trim() || isSubmitting}
                    className={cn(
                      "w-full py-4 rounded-xl font-semibold text-white transition-all touch-manipulation flex items-center justify-center gap-2",
                      value.trim() && !isSubmitting
                        ? "bg-purple-600 dark:bg-purple-500 active:bg-purple-700 dark:active:bg-purple-600"
                        : "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Brain className="h-5 w-5" />
                        Save to Inbox
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
