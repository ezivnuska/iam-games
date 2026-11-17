'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';

export default function GameScreen({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Disable swipe-back/forward navigation while a game screen is mounted.
        // CSS alone (overscroll-behavior, touch-action) doesn't block the browser's
        // edge-swipe gesture on iOS Safari or Chrome Android — we need non-passive
        // touchmove prevention at the document level.
        const prevBodyOverscroll = document.body.style.overscrollBehavior;
        const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
        document.body.style.overscrollBehavior = 'none';
        document.documentElement.style.overscrollBehavior = 'none';

        let startX = 0;
        let startY = 0;

        const onTouchStart = (e: TouchEvent) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        };

        const onTouchMove = (e: TouchEvent) => {
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            const isHorizontal = Math.abs(dx) > Math.abs(dy);
            const isEdgeSwipe = startX < 30 || startX > window.innerWidth - 30;
            if (isHorizontal && isEdgeSwipe) {
                e.preventDefault();
            }
        };

        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove', onTouchMove, { passive: false });

        return () => {
            document.body.style.overscrollBehavior = prevBodyOverscroll;
            document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', onTouchMove);
        };
    }, []);

    return (
        <div className='fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900'>
            <Link
                href='/games'
                className='absolute top-3 left-3 z-[9999] flex items-center justify-center w-8 h-8 rounded-full bg-white/80 shadow-sm hover:bg-white transition-colors'
            >
                <ArrowLeftIcon className='h-5 w-5 text-gray-700' />
            </Link>
            <div className='flex flex-1 min-h-0 flex-col'>
                {children}
            </div>
        </div>
    );
}
