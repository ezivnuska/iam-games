// app/layout.tsx

export const dynamic = 'force-dynamic';

import '@/app/ui/global.css';
import { ubuntu } from '@/app/ui/fonts';
import { getSessionUser } from '@/app/lib/utils/auth';
import { UserProvider } from '@/app/lib/providers/user-provider';
import { SocketProvider } from '@/app/lib/providers/socket-provider';
import { TileProvider } from '@/app/lib/providers/tile-provider';
import SiteSwitcher from '@/app/ui/site-switcher';
import type { SessionUser } from '@/app/lib/utils/auth';
import type { Viewport } from 'next';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
};

export const metadata = {
    title: 'IAM Games',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    let initialUser: SessionUser | null = null;
    try {
        const session = await getSessionUser();
        if (session) {
            initialUser = { id: session.id, username: session.username, role: session.role };
        }
    } catch {
        // unauthenticated
    }

    return (
        <html lang='en' suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                const theme = localStorage.getItem('theme') || 'system';
                                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                                const applied = theme === 'system' ? systemTheme : theme;
                                document.documentElement.classList.add(applied);
                            })();
                        `,
                    }}
                />
            </head>
            <body className={`${ubuntu.className} antialiased flex min-h-screen flex-col overflow-x-hidden`}>
                <SiteSwitcher />
                <UserProvider initialUser={initialUser}>
                    <SocketProvider>
                        <TileProvider>
                            {children}
                        </TileProvider>
                    </SocketProvider>
                </UserProvider>
            </body>
        </html>
    );
}
