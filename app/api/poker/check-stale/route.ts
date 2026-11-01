// app/api/poker/check-stale/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PokerGame } from '@/app/games/poker/lib/models/poker-game';
import { connectToDatabase } from '@/app/lib/mongoose';

const STALE_THRESHOLD_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await connectToDatabase();

    const game = await PokerGame.findOne({ code: 'MAIN' });

    if (!game) {
      return NextResponse.json({ message: 'No singleton game found' }, { status: 404 });
    }

    const lastUpdate = game.updatedAt.getTime();
    const now = Date.now();
    const timeSinceUpdate = now - lastUpdate;

    const isStale =
      timeSinceUpdate > STALE_THRESHOLD_MS &&
      game.locked &&
      game.players?.length > 0;

    if (!isStale) {
      return NextResponse.json({
        message: 'Game is not stale',
        timeSinceUpdate: Math.round(timeSinceUpdate / 1000),
        isLocked: game.locked,
        playerCount: game.players?.length || 0,
      });
    }

    const gameId = String(game._id);
    console.log('[CheckStale] Stale game detected, triggering reset:', {
      gameId,
      timeSinceUpdate: Math.round(timeSinceUpdate / 1000) + 's',
    });

    const { resetSingletonGame } = await import('@/app/games/poker/lib/server/game/singleton-game');
    await resetSingletonGame(gameId);

    const { PokerSocketEmitter } = await import('@/app/lib/utils/socket-helper');
    await PokerSocketEmitter.emitGameStaleReset();

    return NextResponse.json({
      message: 'Stale game reset successfully',
      timeSinceUpdate: Math.round(timeSinceUpdate / 1000),
      wasLocked: game.locked,
      playerCount: game.players?.length || 0,
    });
  } catch (error: any) {
    console.error('[CheckStale] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
