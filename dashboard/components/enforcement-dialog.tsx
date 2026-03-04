"use client"

import type { JSX } from "react"
import { Loader2 } from "lucide-react"

interface EnforcementDialogProps {
  open: boolean
  inProgressTaskDescription: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function EnforcementDialog({
  open,
  inProgressTaskDescription,
  onConfirm,
  onCancel,
  isLoading = false,
}: EnforcementDialogProps): JSX.Element {
  if (!open) {
    return <></>
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={onCancel}
      aria-hidden={!open}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="enforcement-dialog-title"
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <h2
            id="enforcement-dialog-title"
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
          >
            Task In Progress
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You already have a task in progress:
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 rounded p-2 text-sm text-gray-800 dark:text-gray-200">
            {inProgressTaskDescription}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Would you like to complete it and start the new task?
          </p>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Keep Working
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#1a759f] dark:bg-[#38bdf8] text-white hover:bg-[#1e6091] dark:hover:bg-[#60a5fa] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? "Starting..." : "Complete & Start"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
