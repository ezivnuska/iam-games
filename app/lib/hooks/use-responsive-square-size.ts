// app/lib/hooks/use-responsive-square-size.ts

'use client';

import { useEffect, useState, RefObject } from 'react';

export function useResponsiveSquareSize<T extends HTMLElement = HTMLElement>(
    containerRef: RefObject<T>,
    dependencies: any[] = []
): number {
    const [size, setSize] = useState<number>(0);

    useEffect(() => {
        let rafId: number | null = null;

        const updateSize = () => {
            if (!containerRef.current) return;

            const parent = containerRef.current.parentElement;
            if (!parent) return;

            const parentWidth = parent.clientWidth;
            const parentHeight = parent.clientHeight;

            const rect = containerRef.current.getBoundingClientRect();
            const availableVerticalSpace = window.innerHeight - rect.top;

            // Skip parentHeight if 0 — happens when parent height is derived from children (circular)
            const candidates = parentHeight > 0
                ? [parentWidth, parentHeight, availableVerticalSpace]
                : [parentWidth, availableVerticalSpace];
            const squareSize = Math.min(...candidates);

            setSize(prevSize => {
                if (squareSize !== prevSize && squareSize > 0) {
                    return squareSize;
                }
                return prevSize;
            });
        };

        const debouncedUpdate = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updateSize);
        };

        const updateSizeWithRetries = () => {
            updateSize();
            requestAnimationFrame(() => {
                updateSize();
                setTimeout(updateSize, 50);
                setTimeout(updateSize, 150);
            });
        };

        updateSizeWithRetries();

        const parentObserver = new ResizeObserver(() => {
            debouncedUpdate();
        });

        const selfObserver = new ResizeObserver(() => {
            debouncedUpdate();
        });

        if (containerRef.current) {
            selfObserver.observe(containerRef.current);
            if (containerRef.current.parentElement) {
                parentObserver.observe(containerRef.current.parentElement);
            }
        }

        const handleResize = () => {
            debouncedUpdate();
            updateSize();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            parentObserver.disconnect();
            selfObserver.disconnect();
            window.removeEventListener('resize', handleResize);
        };
    }, dependencies);

    return size;
}
