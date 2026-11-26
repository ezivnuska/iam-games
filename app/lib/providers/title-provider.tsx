'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type ScreenLayout = 'default' | 'game';

interface TitleContextValue {
    title: string | null;
    setTitle: (title: string | null) => void;
    screenLayout: ScreenLayout;
    setScreenLayout: (layout: ScreenLayout) => void;
    leaveHandler: (() => void) | null;
    setLeaveHandler: (fn: (() => void) | null) => void;
}

const TitleContext = createContext<TitleContextValue>({
    title: null,
    setTitle: () => {},
    screenLayout: 'default',
    setScreenLayout: () => {},
    leaveHandler: null,
    setLeaveHandler: () => {},
});

export function TitleProvider({ children }: { children: React.ReactNode }) {
    const [title, setTitle] = useState<string | null>(null);
    const [screenLayout, setScreenLayout] = useState<ScreenLayout>('default');
    const [leaveHandler, setLeaveHandler] = useState<(() => void) | null>(null);
    return (
        <TitleContext.Provider value={{ title, setTitle, screenLayout, setScreenLayout, leaveHandler, setLeaveHandler }}>
            {children}
        </TitleContext.Provider>
    );
}

export function useTitle() {
    return useContext(TitleContext);
}

export function useSetTitle(title: string) {
    const { setTitle } = useTitle();
    useEffect(() => {
        setTitle(title);
        return () => setTitle(null);
    }, [title, setTitle]);
}

export function useSetScreenLayout(layout: ScreenLayout) {
    const { setScreenLayout } = useTitle();
    useEffect(() => {
        setScreenLayout(layout);
        return () => setScreenLayout('default');
    }, [layout, setScreenLayout]);
}

export function SetTitle({ title }: { title: string }) {
    useSetTitle(title);
    return null;
}

export function useSetLeaveHandler(handler: (() => void) | null) {
    const { setLeaveHandler } = useTitle();
    useEffect(() => {
        setLeaveHandler(() => handler);
        return () => setLeaveHandler(null);
    }, [handler]);
}
