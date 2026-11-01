'use client';

import clsx from 'clsx';
import { useHorizontalLayout } from '@iam/ui';
import { useUser } from '@/app/lib/providers/user-provider';
import { UserAvatar } from '@iam/ui';

export default function UserButton() {
    const { user, signIn, signOut } = useUser();
    const horizontalLayout = useHorizontalLayout();

    const isUnauthenticated = !user || user.isGuest;

    if (isUnauthenticated) {
        return (
            <button
                onClick={signIn}
                className='flex items-center justify-center h-10 rounded-full px-4 text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors'
            >
                Sign In
            </button>
        );
    }

    return (
        <button
            onClick={() => signOut()}
            className={clsx('w-[40px] h-[40px] shrink-0', {
                'w-[56px] h-[56px]': horizontalLayout,
            })}
            title={`Sign out ${user.username}`}
        >
            <UserAvatar username={user.username} size={horizontalLayout ? 72 : 50} />
        </button>
    );
}
