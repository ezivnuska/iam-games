'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { PageContent, PageHeader, useFooter } from '@iam/ui'
import TileBoard from './tile-board'
import TileGameControls from './tile-game-controls'

export default function TileGame() {
    const { setFooter } = useFooter()

    useEffect(() => {
        setFooter(<TileGameControls />)
        return () => setFooter(null)
    }, [setFooter])

    useEffect(() => {
        const prev = document.body.style.overscrollBehavior
        const prevHtml = document.documentElement.style.overscrollBehavior
        document.body.style.overscrollBehavior = 'none'
        document.documentElement.style.overscrollBehavior = 'none'
        let startX = 0, startY = 0
        const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY }
        const onTouchMove = (e: TouchEvent) => {
            const dx = e.touches[0].clientX - startX
            const dy = e.touches[0].clientY - startY
            if (Math.abs(dx) > Math.abs(dy) && (startX < 30 || startX > window.innerWidth - 30))
                e.preventDefault()
        }
        document.addEventListener('touchstart', onTouchStart, { passive: true })
        document.addEventListener('touchmove', onTouchMove, { passive: false })
        return () => {
            document.body.style.overscrollBehavior = prev
            document.documentElement.style.overscrollBehavior = prevHtml
            document.removeEventListener('touchstart', onTouchStart)
            document.removeEventListener('touchmove', onTouchMove)
        }
    }, [])

    const header = (
        <PageHeader
            title='Tiles'
            actions={
                <Link href='/games' className='flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors'>
                    <ArrowLeftIcon className='h-4 w-4' />
                    Games
                </Link>
            }
        />
    )

    return (
        <PageContent header={header} scrollable={false} fullscreen>
            <div className='flex flex-1 min-h-0 min-w-0 items-center justify-center'>
                <TileBoard />
            </div>
        </PageContent>
    )
}
