"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Cloud,
  CloudOff,
  RefreshCw,
  AlertCircle,
  Check,
  Upload,
  Download,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

type SyncStatus =
  | 'synced'
  | 'pending'
  | 'behind'
  | 'diverged'
  | 'syncing'
  | 'error'
  | 'no-remote'

interface SyncState {
  status: SyncStatus
  lastSync: string | null
  localChanges: number
  remoteChanges: number
  error: string | null
  branch: string | null
  remote: string | null
}

interface SyncStatusProps {
  className?: string
  compact?: boolean
}

export function SyncStatus({ className, compact = false }: SyncStatusProps) {
  const [state, setState] = useState<SyncState | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/sync')
      if (res.ok) {
        const data = await res.json()
        setState(data)
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error)
    }
  }, [])

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchStatus])

  // Listen for task changes to update status
  useEffect(() => {
    const handleTaskChange = () => {
      // Delay slightly to allow file write to complete
      setTimeout(fetchStatus, 500)
    }
    window.addEventListener('taskCreated', handleTaskChange)
    return () => window.removeEventListener('taskCreated', handleTaskChange)
  }, [fetchStatus])

  const handleSync = async () => {
    if (isSyncing) return
    setIsSyncing(true)

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Manual sync' })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Sync failed')
      }

      // Refresh status after sync
      await fetchStatus()
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handlePull = async () => {
    if (isSyncing) return
    setIsSyncing(true)

    try {
      await fetch('/api/sync?action=pull', { method: 'POST' })
      await fetchStatus()
    } catch (error) {
      console.error('Pull failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handlePush = async () => {
    if (isSyncing) return
    setIsSyncing(true)

    try {
      await fetch('/api/sync?action=push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Push changes' })
      })
      await fetchStatus()
    } catch (error) {
      console.error('Push failed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  // Render loading state
  if (!state) {
    return (
      <div className={cn("flex items-center gap-1 text-gray-400 dark:text-gray-500", className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        {!compact && <span className="text-xs">Loading...</span>}
      </div>
    )
  }

  // Status icon and color
  const getStatusDisplay = () => {
    if (isSyncing) {
      return {
        icon: RefreshCw,
        color: 'text-blue-500 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/30',
        label: 'Syncing...',
        animate: true
      }
    }

    switch (state.status) {
      case 'synced':
        return {
          icon: Check,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-900/30',
          label: 'Synced',
          animate: false
        }
      case 'pending':
        return {
          icon: Upload,
          color: 'text-amber-500 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-900/30',
          label: `${state.localChanges} to push`,
          animate: false
        }
      case 'behind':
        return {
          icon: Download,
          color: 'text-blue-500 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-900/30',
          label: `${state.remoteChanges} to pull`,
          animate: false
        }
      case 'diverged':
        return {
          icon: AlertCircle,
          color: 'text-orange-500 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/30',
          label: 'Diverged',
          animate: false
        }
      case 'error':
        return {
          icon: AlertCircle,
          color: 'text-red-500 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-900/30',
          label: 'Error',
          animate: false
        }
      case 'no-remote':
        return {
          icon: CloudOff,
          color: 'text-gray-400 dark:text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-800',
          label: 'No remote',
          animate: false
        }
      default:
        return {
          icon: Cloud,
          color: 'text-gray-400 dark:text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-800',
          label: 'Unknown',
          animate: false
        }
    }
  }

  const display = getStatusDisplay()
  const Icon = display.icon

  // Format last sync time
  const formatLastSync = (lastSync: string | null) => {
    if (!lastSync) return 'Never'
    const date = new Date(lastSync)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  // Compact view for header
  if (compact) {
    return (
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md transition-colors",
          display.bgColor,
          display.color,
          "hover:opacity-80",
          className
        )}
        title={display.label}
      >
        <Icon className={cn("h-4 w-4", display.animate && "animate-spin")} />
        {state.status !== 'synced' && state.status !== 'no-remote' && (
          <span className="text-xs font-medium">
            {state.localChanges > 0 && `↑${state.localChanges}`}
            {state.remoteChanges > 0 && `↓${state.remoteChanges}`}
          </span>
        )}
      </button>
    )
  }

  // Full view with details
  return (
    <div className={cn("rounded-lg border dark:border-[var(--card-border)] p-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-full", display.bgColor)}>
            <Icon className={cn("h-5 w-5", display.color, display.animate && "animate-spin")} />
          </div>
          <div>
            <p className={cn("text-sm font-medium", display.color)}>
              {display.label}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {state.branch && `${state.branch}`}
              {state.lastSync && ` · ${formatLastSync(state.lastSync)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {state.status === 'behind' || state.status === 'diverged' ? (
            <button
              onClick={handlePull}
              disabled={isSyncing}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50"
              title="Pull changes"
            >
              <Download className="h-4 w-4" />
            </button>
          ) : null}

          {state.status === 'pending' || state.status === 'diverged' ? (
            <button
              onClick={handlePush}
              disabled={isSyncing}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50"
              title="Push changes"
            >
              <Upload className="h-4 w-4" />
            </button>
          ) : null}

          <button
            onClick={handleSync}
            disabled={isSyncing || state.status === 'no-remote'}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 disabled:opacity-50"
            title="Sync now"
          >
            <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
          </button>
        </div>
      </div>

      {state.error && (
        <p className="mt-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-2 rounded">
          {state.error}
        </p>
      )}
    </div>
  )
}
