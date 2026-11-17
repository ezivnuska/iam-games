// app/ui/tile-game-header.tsx

'use client';

import { useTiles } from '@/app/lib/providers/tile-provider'

export default function TileGameHeader() {
    const { ticks, time } = useTiles();

    return (
        <div className='flex flex-row items-center w-full'>
            {time && ticks > 0 && (
                <span className='font-bold text-xl'>{time}</span>
            )}
        </div>
    )
}
