'use client';

import { Screen, FooterProvider, useFooter, useAppHeight, useHorizontalLayout } from '@iam/ui';
import SignInButton from '@/app/ui/header/sign-in-button';
import GameNav from '@/app/ui/header/game-nav';
import { TitleProvider, useTitle } from '@/app/lib/providers/title-provider';
interface ClientShellProps {
    children: React.ReactNode;
    loggedIn: boolean;
}

function ShellInner({ children, loggedIn }: ClientShellProps) {
    const { footer } = useFooter();
    const { title, screenLayout } = useTitle();
    const isLandscape = useHorizontalLayout();
    useAppHeight();

    const showGameNav = loggedIn || !!title;

    return (
        <Screen
            brandHref='https://iameric.me'
            nav={
                <div className={isLandscape ? 'flex flex-col items-center gap-3' : 'flex flex-row items-center gap-3'}>
                    {!loggedIn && <SignInButton />}
                    {showGameNav && <GameNav title={title} />}
                </div>
            }
            footer={footer}
            layout={screenLayout}
            centerAside
        >
            {children}
        </Screen>
    );
}

export default function ClientShell({ children, loggedIn }: ClientShellProps) {
    return (
        <FooterProvider>
            <TitleProvider>
                <ShellInner loggedIn={loggedIn}>{children}</ShellInner>
            </TitleProvider>
        </FooterProvider>
    );
}
