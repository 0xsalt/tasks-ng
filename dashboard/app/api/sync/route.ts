/**
 * Sync API Routes
 *
 * GET  /api/sync - Get sync status
 * POST /api/sync - Perform sync (pull + push)
 * POST /api/sync?action=pull - Pull only
 * POST /api/sync?action=push - Push only
 * POST /api/sync?action=init - Initialize sync with remote
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getSyncStatus,
  sync,
  pullChanges,
  pushChanges,
  initSync
} from '@/lib/git-sync'

export const dynamic = 'force-dynamic'

/**
 * GET /api/sync - Get current sync status
 */
export async function GET() {
  try {
    const status = await getSyncStatus()
    return NextResponse.json(status)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get sync status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sync - Perform sync operation
 *
 * Query params:
 *   action: 'sync' | 'pull' | 'push' | 'init' (default: 'sync')
 *
 * Body (for push/sync):
 *   message?: string - Commit message
 *
 * Body (for init):
 *   remoteUrl: string - Git remote URL
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'sync'

    let body: { message?: string; remoteUrl?: string } = {}
    try {
      body = await request.json()
    } catch {
      // No body or invalid JSON is OK for some actions
    }

    let result

    switch (action) {
      case 'pull':
        result = await pullChanges()
        break

      case 'push':
        result = await pushChanges(body.message)
        break

      case 'init':
        if (!body.remoteUrl) {
          return NextResponse.json(
            { error: 'remoteUrl is required for init' },
            { status: 400 }
          )
        }
        result = await initSync(body.remoteUrl)
        break

      case 'sync':
      default:
        result = await sync(body.message)
        break
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 409 })
    }

    return NextResponse.json(result)

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync operation failed' },
      { status: 500 }
    )
  }
}
