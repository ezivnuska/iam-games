// app/api/poker/reset-singleton/route.ts

import { withAuth } from '@/app/lib/api/with-auth';
import { resetSingletonGame } from '@/app/games/poker/lib/server/game/singleton-game';
import { PokerSocketEmitter } from '@/app/lib/utils/socket-helper';
import { withRateLimit, RATE_LIMITS } from '@/app/lib/api/rate-limiter';
import { UserRole } from '@/app/lib/definitions/user';

export const POST = withRateLimit(RATE_LIMITS.DESTRUCTIVE, withAuth(async (request, context, user) => {
  if (user.role !== UserRole.Admin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { gameId } = await request.json();

    if (!gameId) {
      return Response.json({ error: 'Game ID is required' }, { status: 400 });
    }

    console.log(`[ResetSingleton] Resetting game ${gameId} by user ${user.username}`);

    const resetGame = await resetSingletonGame(gameId);

    await PokerSocketEmitter.emitNotificationCanceled();
    await PokerSocketEmitter.emitTimerCleared();
    await PokerSocketEmitter.emitStateUpdate(resetGame.toObject());

    return Response.json({ success: true, gameState: resetGame.toObject() });
  } catch (error: any) {
    const errorMessage = error?.message || 'Failed to reset game';
    console.error('[ResetSingleton] Error:', errorMessage);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}));
