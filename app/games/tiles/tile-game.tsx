// app/tiles/tile-game.tsx

'use client'

import TileGameHeader from './tile-game-header';
import TileBoard from './tile-board';
import { PageContent } from '@iam/ui';
import { FlexContainer, FlexCenter } from '@iam/ui';
import { useHorizontalLayout } from '@iam/ui';

export default function TileGame() {
    const horizontalLayout = useHorizontalLayout();
    return (
        <PageContent>
            <FlexContainer className='items-stretch'>
                <div className='flex flex-row items-center justify-end gap-4 w-full'>
                    <TileGameHeader />
                </div>
                <FlexCenter className='flex-col mx-2'>
                    <TileBoard />
                </FlexCenter>
            </FlexContainer>
        </PageContent>
    );
}