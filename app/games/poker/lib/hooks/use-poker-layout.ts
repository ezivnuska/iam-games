'use client';

import { useState, useCallback } from 'react';

export type PokerLayout = 'classic' | 'list';

const STORAGE_KEY = 'poker_layout';

export function usePokerLayout() {
    const [layout, setLayout] = useState<PokerLayout>(() => {
        if (typeof window === 'undefined') return 'classic';
        return (localStorage.getItem(STORAGE_KEY) as PokerLayout) ?? 'list';
    });

    const toggleLayout = useCallback(() => {
        setLayout(prev => {
            const next = prev === 'classic' ? 'list' : 'classic';
            localStorage.setItem(STORAGE_KEY, next);
            return next;
        });
    }, []);

    return { layout, toggleLayout };
}
