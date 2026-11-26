'use client';

import { useState, useEffect } from 'react';
import type { Notification } from '../providers/notification-provider';

export function useNotificationProgress(notification: Notification | null): number {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!notification) { setProgress(0); return; }

        const start = Date.now();
        const { duration } = notification;

        setProgress(100);

        const iv = setInterval(() => {
            const remaining = Math.max(0, duration - (Date.now() - start));
            setProgress((remaining / duration) * 100);
            if (remaining <= 0) clearInterval(iv);
        }, 100);

        return () => clearInterval(iv);
    }, [notification]);

    return progress;
}
