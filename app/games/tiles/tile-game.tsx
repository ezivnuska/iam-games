// app/tiles/tile-game.tsx

'use client'

import TileGameHeader from './tile-game-header';
import TileBoard from './tile-board';
import { PageContent } from '@iam/ui';

export default function TileGame() {
    return (
        <PageContent>
            <div className='flex flex-1 min-h-0 min-w-0 flex-col items-stretch'>
                <div className='flex flex-row items-center justify-end gap-4 w-full'>
                    <TileGameHeader />
                </div>
                <div className='flex flex-1 min-h-0 min-w-0 items-center justify-center flex-col mx-2'>
                    <TileBoard />
                </div>
            </div>
        </PageContent>
    );
}