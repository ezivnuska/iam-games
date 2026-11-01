// app/api/socket/emit/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { checkSocketRateLimit, SOCKET_RATE_LIMITS } from '@/app/lib/api/socket-rate-limiter'
import { generateGuestId, generateGuestUsername, isGuestId } from '@/app/games/poker/lib/utils/guest-utils'

export async function POST(request: NextRequest) {
    const secret = request.headers.get('x-internal-secret')
    if (!secret || secret !== process.env.INTERNAL_SECRET) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { event, room, data, excludeUserId, signal, gameId, userId, username } = body

        async function validateUserId(userId: string): Promise<{ valid: boolean; error?: string }> {
            if (isGuestId(userId)) {
                return { valid: true };
            }

            try {
                const UserModel = (await import('@/app/lib/models/user')).default;
                const user = await UserModel.findById(userId);

                if (!user) {
                    return { valid: false, error: 'User not found' };
                }

                return { valid: true };
            } catch (error) {
                console.error('[validateUserId] Error:', error);
                return { valid: false, error: 'Invalid user ID' };
            }
        }

        if (signal) {
            const { connectToDatabase } = await import('@/app/lib/mongoose');
            await connectToDatabase();

            if (signal === 'poker:join_game' && gameId && userId) {
                let validatedUserId: string;
                let validatedUsername: string;

                if (isGuestId(userId)) {
                    if (username && username.trim()) {
                        const trimmedUsername = username.trim();
                        if (trimmedUsername.length < 2) {
                            return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 });
                        }
                        if (trimmedUsername.length > 20) {
                            return NextResponse.json({ error: 'Username must be 20 characters or less' }, { status: 400 });
                        }
                        validatedUsername = trimmedUsername;
                    } else {
                        validatedUsername = generateGuestUsername();
                    }
                    validatedUserId = userId;
                } else {
                    try {
                        const UserModel = (await import('@/app/lib/models/user')).default;
                        const user = await UserModel.findById(userId);

                        if (!user) {
                            return NextResponse.json({ error: 'User not found' }, { status: 404 });
                        }

                        validatedUserId = user._id.toString();
                        validatedUsername = user.username || 'Player';
                    } catch (error) {
                        return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
                    }
                }

                const { handlePlayerJoin } = await import('@/app/games/poker/lib/server/actions/poker-game-controller');
                const result = await handlePlayerJoin(gameId, validatedUserId, validatedUsername);

                if (!result.success) {
                    const errorMessage = result.error || 'Failed to join game';

                    if (errorMessage.includes('locked')) {
                        return NextResponse.json({ error: 'Game is locked - no new players allowed' }, { status: 409 });
                    } else if (errorMessage.includes('full')) {
                        return NextResponse.json({ error: 'Game is full' }, { status: 409 });
                    } else if (errorMessage.includes('not found')) {
                        return NextResponse.json({ error: 'Game not found' }, { status: 404 });
                    }

                    return NextResponse.json({ error: errorMessage }, { status: 500 });
                }

                return NextResponse.json({
                    success: true,
                    gameState: result.gameState,
                    userId: validatedUserId,
                    username: validatedUsername
                });
            }

            if (signal === 'poker:leave_game' && gameId && userId) {
                const validation = await validateUserId(userId);
                if (!validation.valid) {
                    return NextResponse.json({ error: validation.error }, { status: 403 });
                }

                const { handlePlayerLeave } = await import('@/app/games/poker/lib/server/actions/poker-game-controller');
                const result = await handlePlayerLeave(gameId, userId);

                if (!result.success) {
                    const errorMessage = result.error || 'Failed to leave game';
                    if (errorMessage.includes('not found')) {
                        return NextResponse.json({ error: 'Game or player not found' }, { status: 404 });
                    }
                    return NextResponse.json({ error: errorMessage }, { status: 500 });
                }

                return NextResponse.json({ success: true, gameState: result.gameState });
            }

            if (signal === 'poker:ready_for_next_turn' && gameId) {
                const { handleReadyForNextTurn } = await import('@/app/games/poker/lib/server/turn/turn-handler');
                await handleReadyForNextTurn(gameId);
                return NextResponse.json({ success: true });
            }

            if (signal === 'poker:bet' && gameId && userId) {
                const validation = await validateUserId(userId);
                if (!validation.valid) {
                    return NextResponse.json({ error: validation.error }, { status: 403 });
                }

                const rateLimit = checkSocketRateLimit(userId, 'poker:bet', SOCKET_RATE_LIMITS.GAME_ACTION);
                if (rateLimit.isLimited) {
                    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
                    return NextResponse.json(
                        { error: 'Too many bet requests. Please slow down.' },
                        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
                    );
                }

                const { placeBet } = await import('@/app/games/poker/lib/server/actions/poker-game-controller');
                const { chipCount } = body;

                try {
                    const result = await placeBet(gameId, userId, chipCount ?? 1);
                    const { PokerSocketEmitter } = await import('@/app/lib/utils/socket-helper');
                    await PokerSocketEmitter.emitGameActionResults(result.events);
                    return NextResponse.json({ success: true });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to place bet';
                    return NextResponse.json({ error: errorMessage }, { status: 500 });
                }
            }

            if (signal === 'poker:fold' && gameId && userId) {
                const validation = await validateUserId(userId);
                if (!validation.valid) {
                    return NextResponse.json({ error: validation.error }, { status: 403 });
                }

                const rateLimit = checkSocketRateLimit(userId, 'poker:fold', SOCKET_RATE_LIMITS.GAME_ACTION);
                if (rateLimit.isLimited) {
                    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
                    return NextResponse.json(
                        { error: 'Too many fold requests. Please slow down.' },
                        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
                    );
                }

                const { fold } = await import('@/app/games/poker/lib/server/actions/poker-game-controller');

                try {
                    await fold(gameId, userId);
                    return NextResponse.json({ success: true });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to fold';
                    return NextResponse.json({ error: errorMessage }, { status: 500 });
                }
            }

            if (signal === 'poker:set_timer_action' && gameId && userId) {
                const validation = await validateUserId(userId);
                if (!validation.valid) {
                    return NextResponse.json({ error: validation.error }, { status: 403 });
                }

                const rateLimit = checkSocketRateLimit(userId, 'poker:set_timer_action', SOCKET_RATE_LIMITS.TIMER);
                if (rateLimit.isLimited) {
                    const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
                    return NextResponse.json(
                        { error: 'Too many timer action requests. Please slow down.' },
                        { status: 429, headers: { 'Retry-After': retryAfter.toString() } }
                    );
                }

                const { setTurnTimerAction } = await import('@/app/games/poker/lib/server/actions/poker-game-controller');
                const { timerAction, betAmount } = body;

                if (!timerAction || !['fold', 'call', 'check', 'bet', 'raise'].includes(timerAction)) {
                    return NextResponse.json(
                        { error: 'Invalid timerAction. Must be one of: fold, call, check, bet, raise' },
                        { status: 400 }
                    );
                }

                try {
                    await setTurnTimerAction(gameId, userId, timerAction, betAmount);
                    return NextResponse.json({ success: true });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to set timer action';
                    return NextResponse.json({ error: errorMessage }, { status: 500 });
                }
            }

            if (signal === 'poker:set_presence' && gameId && userId) {
                const validation = await validateUserId(userId);
                if (!validation.valid) {
                    return NextResponse.json({ error: validation.error }, { status: 403 });
                }

                const { setPlayerPresence } = await import('@/app/games/poker/lib/server/actions/poker-game-controller');
                const { isAway } = body;

                try {
                    await setPlayerPresence(gameId, userId, isAway);
                    return NextResponse.json({ success: true });
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Failed to set presence';
                    return NextResponse.json({ error: errorMessage }, { status: 500 });
                }
            }

            if (signal === 'poker:winner_notification_complete' && gameId) {
                const { StageManager } = await import('@/app/games/poker/lib/server/flow/stage-manager');
                const { PokerGame } = await import('@/app/games/poker/lib/models/poker-game');

                const game = await PokerGame.findById(gameId);
                if (!game) {
                    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
                }

                await StageManager.resetGameForNextRound(game);
                return NextResponse.json({ success: true });
            }

            if (signal === 'poker:player_reconnected' && userId) {
                const validation = await validateUserId(userId);
                if (!validation.valid) {
                    return NextResponse.json({ error: validation.error }, { status: 403 });
                }

                const { PokerGame } = await import('@/app/games/poker/lib/models/poker-game');
                const game = await PokerGame.findOne({ code: 'MAIN' });

                if (!game) {
                    return NextResponse.json({ error: 'No active game' }, { status: 404 });
                }

                const playerIndex = game.players.findIndex((p: any) => p.id === userId);

                if (playerIndex === -1) {
                    return NextResponse.json({ success: true, message: 'Player not in game' });
                }

                const player = game.players[playerIndex];
                const wasAway = player.isAway;

                if (wasAway) {
                    player.isAway = false;
                    game.markModified('players');
                    await game.save();

                    const { PokerSocketEmitter } = await import('@/app/lib/utils/socket-helper');
                    await PokerSocketEmitter.emitPlayerPresenceUpdated({
                        playerId: userId,
                        isAway: false,
                    });
                }

                return NextResponse.json({ success: true, wasAway });
            }

            return NextResponse.json({ error: 'Unknown signal' }, { status: 400 });
        }

        if (typeof global.io === 'undefined') {
            console.error('Socket.IO not initialized')
            return NextResponse.json({ error: 'Socket.IO not initialized' }, { status: 500 })
        }

        const io = global.io as any

        if (excludeUserId) {
            const sockets = await io.fetchSockets()
            for (const socket of sockets) {
                if (socket.userId !== excludeUserId) {
                    if (room) {
                        if (socket.rooms.has(room)) socket.emit(event, data)
                    } else {
                        socket.emit(event, data)
                    }
                }
            }
        } else if (room) {
            io.to(room).emit(event, data)
        } else {
            io.emit(event, data)
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Socket emit error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
