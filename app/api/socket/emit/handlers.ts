// Signal handlers for app/api/socket/emit/route.ts
// Each exported function handles one poker signal type.

import { NextResponse } from 'next/server'
import { checkSocketRateLimit, SOCKET_RATE_LIMITS } from '@/app/lib/api/socket-rate-limiter'
import { generateGuestUsername, isGuestId } from '@/app/games/poker/lib/utils/guest-utils'

export interface SignalBody {
    signal: string
    gameId?: string
    userId?: string
    username?: string
    chipCount?: number
    timerAction?: string
    betAmount?: number
    isAway?: boolean
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function validateUserId(userId: string): Promise<{ valid: boolean; error?: string }> {
    if (isGuestId(userId)) return { valid: true }
    try {
        const UserModel = (await import('@/app/lib/models/user')).default
        const user = await UserModel.findById(userId)
        return user ? { valid: true } : { valid: false, error: 'User not found' }
    } catch {
        return { valid: false, error: 'Invalid user ID' }
    }
}

function rateLimited(resetTime: number, message: string): NextResponse {
    const retryAfter = Math.ceil((resetTime - Date.now()) / 1000)
    return NextResponse.json(
        { error: message },
        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
    )
}

// ---------------------------------------------------------------------------
// Signal handlers
// ---------------------------------------------------------------------------

export async function handleJoinGame(body: SignalBody): Promise<NextResponse> {
    const { gameId, userId, username } = body
    if (!gameId || !userId) return NextResponse.json({ error: 'Missing gameId or userId' }, { status: 400 })

    let validatedUserId: string
    let validatedUsername: string

    if (isGuestId(userId)) {
        if (username && username.trim()) {
            const trimmed = username.trim()
            if (trimmed.length < 2) return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 })
            if (trimmed.length > 20) return NextResponse.json({ error: 'Username must be 20 characters or less' }, { status: 400 })
            validatedUsername = trimmed
        } else {
            validatedUsername = generateGuestUsername()
        }
        validatedUserId = userId
    } else {
        try {
            const UserModel = (await import('@/app/lib/models/user')).default
            const user = await UserModel.findById(userId)
            if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
            validatedUserId = user._id.toString()
            validatedUsername = user.username || 'Player'
        } catch {
            return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
        }
    }

    const { handlePlayerJoin } = await import('@/app/games/poker/lib/server/actions/poker-game-controller')
    const result = await handlePlayerJoin(gameId, validatedUserId, validatedUsername)

    if (!result.success) {
        const msg = result.error || 'Failed to join game'
        if (msg.includes('locked')) return NextResponse.json({ error: 'Game is locked - no new players allowed' }, { status: 409 })
        if (msg.includes('full'))   return NextResponse.json({ error: 'Game is full' }, { status: 409 })
        if (msg.includes('not found')) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
        return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ success: true, gameState: result.gameState, userId: validatedUserId, username: validatedUsername })
}

export async function handleLeaveGame(body: SignalBody): Promise<NextResponse> {
    const { gameId, userId } = body
    if (!gameId || !userId) return NextResponse.json({ error: 'Missing gameId or userId' }, { status: 400 })

    const validation = await validateUserId(userId)
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 403 })

    const { handlePlayerLeave } = await import('@/app/games/poker/lib/server/actions/poker-game-controller')
    const result = await handlePlayerLeave(gameId, userId)

    if (!result.success) {
        const msg = result.error || 'Failed to leave game'
        if (msg.includes('not found')) return NextResponse.json({ error: 'Game or player not found' }, { status: 404 })
        return NextResponse.json({ error: msg }, { status: 500 })
    }

    return NextResponse.json({ success: true, gameState: result.gameState })
}

export async function handleReadyForNextTurn(body: SignalBody): Promise<NextResponse> {
    const { gameId } = body
    if (!gameId) return NextResponse.json({ error: 'Missing gameId' }, { status: 400 })
    const { handleReadyForNextTurn } = await import('@/app/games/poker/lib/server/turn/turn-handler')
    await handleReadyForNextTurn(gameId)
    return NextResponse.json({ success: true })
}

export async function handleBet(body: SignalBody): Promise<NextResponse> {
    const { gameId, userId, chipCount } = body
    if (!gameId || !userId) return NextResponse.json({ error: 'Missing gameId or userId' }, { status: 400 })

    const validation = await validateUserId(userId)
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 403 })

    const rateLimit = checkSocketRateLimit(userId, 'poker:bet', SOCKET_RATE_LIMITS.GAME_ACTION)
    if (rateLimit.isLimited) return rateLimited(rateLimit.resetTime, 'Too many bet requests. Please slow down.')

    try {
        const { placeBet } = await import('@/app/games/poker/lib/server/actions/poker-game-controller')
        const result = await placeBet(gameId, userId, chipCount ?? 1)
        const { PokerSocketEmitter } = await import('@/app/lib/utils/socket-helper')
        await PokerSocketEmitter.emitGameActionResults(result.events)
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to place bet' }, { status: 500 })
    }
}

export async function handleFold(body: SignalBody): Promise<NextResponse> {
    const { gameId, userId } = body
    if (!gameId || !userId) return NextResponse.json({ error: 'Missing gameId or userId' }, { status: 400 })

    const validation = await validateUserId(userId)
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 403 })

    const rateLimit = checkSocketRateLimit(userId, 'poker:fold', SOCKET_RATE_LIMITS.GAME_ACTION)
    if (rateLimit.isLimited) return rateLimited(rateLimit.resetTime, 'Too many fold requests. Please slow down.')

    try {
        const { fold } = await import('@/app/games/poker/lib/server/actions/poker-game-controller')
        await fold(gameId, userId)
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to fold' }, { status: 500 })
    }
}

export async function handleSetTimerAction(body: SignalBody): Promise<NextResponse> {
    const { gameId, userId, timerAction, betAmount } = body
    if (!gameId || !userId) return NextResponse.json({ error: 'Missing gameId or userId' }, { status: 400 })

    const validation = await validateUserId(userId)
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 403 })

    const rateLimit = checkSocketRateLimit(userId, 'poker:set_timer_action', SOCKET_RATE_LIMITS.TIMER)
    if (rateLimit.isLimited) return rateLimited(rateLimit.resetTime, 'Too many timer action requests. Please slow down.')

    if (!timerAction || !['fold', 'call', 'check', 'bet', 'raise'].includes(timerAction)) {
        return NextResponse.json({ error: 'Invalid timerAction. Must be one of: fold, call, check, bet, raise' }, { status: 400 })
    }

    try {
        const { setTurnTimerAction } = await import('@/app/games/poker/lib/server/actions/poker-game-controller')
        const validAction = timerAction as 'fold' | 'call' | 'check' | 'bet' | 'raise'
        await setTurnTimerAction(gameId, userId, validAction, betAmount)
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to set timer action' }, { status: 500 })
    }
}

export async function handleSetPresence(body: SignalBody): Promise<NextResponse> {
    const { gameId, userId, isAway } = body
    if (!gameId || !userId) return NextResponse.json({ error: 'Missing gameId or userId' }, { status: 400 })

    const validation = await validateUserId(userId)
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 403 })

    try {
        const { setPlayerPresence } = await import('@/app/games/poker/lib/server/actions/poker-game-controller')
        await setPlayerPresence(gameId, userId, isAway ?? false)
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to set presence' }, { status: 500 })
    }
}

export async function handleWinnerNotificationComplete(body: SignalBody): Promise<NextResponse> {
    const { gameId } = body
    if (!gameId) return NextResponse.json({ error: 'Missing gameId' }, { status: 400 })

    const { StageManager } = await import('@/app/games/poker/lib/server/flow/stage-manager')
    const { PokerGame } = await import('@/app/games/poker/lib/models/poker-game')

    const game = await PokerGame.findById(gameId)
    if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

    await StageManager.resetGameForNextRound(game)
    return NextResponse.json({ success: true })
}

export async function handlePlayerReconnected(body: SignalBody): Promise<NextResponse> {
    const { userId } = body
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const validation = await validateUserId(userId)
    if (!validation.valid) return NextResponse.json({ error: validation.error }, { status: 403 })

    const { PokerGame } = await import('@/app/games/poker/lib/models/poker-game')
    const game = await PokerGame.findOne({ code: 'MAIN' })
    if (!game) return NextResponse.json({ error: 'No active game' }, { status: 404 })

    const playerIndex = game.players.findIndex((p: { id: string }) => p.id === userId)
    if (playerIndex === -1) return NextResponse.json({ success: true, message: 'Player not in game' })

    const player = game.players[playerIndex]
    const wasAway = player.isAway

    if (wasAway) {
        player.isAway = false
        game.markModified('players')
        await game.save()
        const { PokerSocketEmitter } = await import('@/app/lib/utils/socket-helper')
        await PokerSocketEmitter.emitPlayerPresenceUpdated({ playerId: userId, isAway: false })
    }

    return NextResponse.json({ success: true, wasAway })
}

// ---------------------------------------------------------------------------
// Dispatch table
// ---------------------------------------------------------------------------

export const SIGNAL_HANDLERS: Record<string, (body: SignalBody) => Promise<NextResponse>> = {
    'poker:join_game':                    handleJoinGame,
    'poker:leave_game':                   handleLeaveGame,
    'poker:ready_for_next_turn':          handleReadyForNextTurn,
    'poker:bet':                          handleBet,
    'poker:fold':                         handleFold,
    'poker:set_timer_action':             handleSetTimerAction,
    'poker:set_presence':                 handleSetPresence,
    'poker:winner_notification_complete': handleWinnerNotificationComplete,
    'poker:player_reconnected':           handlePlayerReconnected,
}
