"use client"

import { useSettings } from "@/app/context/SettingsContext"

export default function SettingsPage() {
  const { settings, updateSetting } = useSettings()

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100">
          Settings
        </h1>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Task Behavior Section */}
        <div className="bg-white dark:bg-[var(--card-bg)] rounded-xl border border-gray-200 dark:border-[var(--card-border)] shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[var(--card-border)]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Task Behavior
            </h2>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Enforce single task in progress
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  When enabled, starting a new task will prompt you to complete the current in-progress task first.
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings.singleTaskEnforcement}
                onClick={() => updateSetting("singleTaskEnforcement", !settings.singleTaskEnforcement)}
                className={`relative inline-flex shrink-0 w-11 h-6 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1a759f] dark:focus:ring-[#38bdf8] focus:ring-offset-2 dark:focus:ring-offset-[var(--card-bg)] cursor-pointer ${
                  settings.singleTaskEnforcement
                    ? "bg-[#1a759f] dark:bg-[#38bdf8]"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <span className="sr-only">
                  {settings.singleTaskEnforcement ? "Disable" : "Enable"} single task enforcement
                </span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block w-5 h-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
                    settings.singleTaskEnforcement ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Display Section (placeholder) */}
        <div className="bg-white dark:bg-[var(--card-bg)] rounded-xl border border-gray-200 dark:border-[var(--card-border)] shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-[var(--card-border)]">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Display
            </h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              More settings coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
