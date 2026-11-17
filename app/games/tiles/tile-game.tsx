// app/tiles/tile-game.tsx

'use client'

import { useEffect, useRef, useState } from 'react'
import TileGameHeader from './tile-game-header';
import TileBoard from './tile-board';
import TileGameControls from './tile-game-controls';
import { PageContent } from '@iam/ui';

export default function TileGame() {
    const controlsRef = useRef<HTMLDivElement>(null)
    const [controlsHeight, setControlsHeight] = useState(0)

    useEffect(() => {
        const el = controlsRef.current
        if (!el) return
        setControlsHeight(el.offsetHeight)
        const obs = new ResizeObserver(() => setControlsHeight(el.offsetHeight))
        obs.observe(el)
        return () => obs.disconnect()
    }, [])

    return (
        <PageContent>
            <div className='flex flex-1 min-h-0 min-w-0 flex-col items-stretch'>
                <div className='flex flex-row items-center justify-end gap-4 w-full'>
                    <TileGameHeader />
                </div>
                <div className='flex flex-1 min-h-0 min-w-0 items-center justify-center flex-col mx-2'>
                    <TileBoard bottomOffset={controlsHeight} />
                    <div ref={controlsRef} className='w-full'>
                        <TileGameControls />
                    </div>
                </div>
            </div>
        </PageContent>
    );
}
