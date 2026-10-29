// app/api/poker/singleton/route.ts

import { NextResponse } from 'next/server';
import { getOrCreateSingletonGame } from '@/app/games/poker/lib/server/game/singleton-game';
import { serializeGame } from '@/app/lib/utils/game-serialization';

export async function GET() {
  try {
    const { connectToDatabase } = await import('@/app/lib/mongoose');
    await connectToDatabase();

    const game = await getOrCreateSingletonGame();
    const serialized = serializeGame(game);

    return NextResponse.json({ game: serialized });
  } catch (error) {
    console.error('Error fetching singleton game:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch game'
    }, { status: 500 });
  }
}
