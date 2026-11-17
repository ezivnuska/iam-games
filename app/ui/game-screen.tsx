'use client';

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';

export default function GameScreen({ children }: { children: React.ReactNode }) {
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
