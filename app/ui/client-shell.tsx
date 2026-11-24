'use client';

import { Screen, FooterProvider, useFooter, useAppHeight } from '@iam/ui';
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
    useAppHeight();

    const showGameNav = loggedIn || !!title;

    return (
        <Screen
            brandHref='https://iameric.me'
            userControls={showGameNav ? <GameNav title={title} /> : undefined}
            nav={loggedIn ? undefined : <SignInButton />}
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
