'use client';

import clsx from 'clsx';
import { useHorizontalLayout } from '@iam/ui';
import { useUser } from '@/app/lib/providers/user-provider';
import { UserAvatar } from '@iam/ui';

export default function UserButton() {
    const { user, signOut } = useUser();
    const horizontalLayout = useHorizontalLayout();

    if (!user || user.isGuest) return null;

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
