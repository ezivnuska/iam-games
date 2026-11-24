'use client';

import { Screen, FooterProvider, useFooter, useAppHeight } from '@iam/ui';
import UserButton from '@/app/ui/header/user-button';
import SignInButton from '@/app/ui/header/sign-in-button';

interface ClientShellProps {
    children: React.ReactNode;
    loggedIn: boolean;
}

function ShellInner({ children, loggedIn }: ClientShellProps) {
    const { footer } = useFooter();
    useAppHeight();

    return (
        <Screen
            brandHref='https://iameric.me'
            userControls={loggedIn ? <UserButton /> : undefined}
            nav={loggedIn ? undefined : <SignInButton />}
            footer={footer}
            centerAside
        >
            {children}
        </Screen>
    );
}

export default function ClientShell({ children, loggedIn }: ClientShellProps) {
    return (
        <FooterProvider>
            <ShellInner loggedIn={loggedIn}>{children}</ShellInner>
        </FooterProvider>
    );
}
