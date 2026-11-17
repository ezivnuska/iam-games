'use client';

import { TableCellsIcon, ListBulletIcon } from '@heroicons/react/24/solid';
import type { PokerLayout } from '@/app/games/poker/lib/hooks/use-poker-layout';

interface LayoutToggleProps {
    layout: PokerLayout;
    onToggle: () => void;
    className?: string;
}

export default function LayoutToggle({ layout, onToggle, className = '' }: LayoutToggleProps) {
    return (
        <button
            onClick={onToggle}
            title={layout === 'classic' ? 'Switch to list view' : 'Switch to classic view'}
            className={`p-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white transition-colors ${className}`}
        >
            {layout === 'classic'
                ? <ListBulletIcon className='w-4 h-4' />
                : <TableCellsIcon className='w-4 h-4' />
            }
        </button>
    );
}
