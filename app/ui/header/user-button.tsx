'use client';

import clsx from 'clsx';
import { useHorizontalLayout } from '@iam/ui';
import { useUser } from '@/app/lib/providers/user-provider';
import { UserAvatar } from '@iam/ui';

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://iameric.me';

export default function UserButton() {
    const { user } = useUser();
    const horizontalLayout = useHorizontalLayout();

    if (!user || user.isGuest) return null;

    const profileUrl = `${MAIN_APP_URL}/users/${user.username}`;

    return (
        <a
            href={profileUrl}
            className={clsx('w-[40px] h-[40px] shrink-0 block', {
                'w-[56px] h-[56px]': horizontalLayout,
            })}
            title={`View profile: ${user.username}`}
        >
            <UserAvatar username={user.username} avatar={user.avatar} size={horizontalLayout ? 72 : 50} />
        </a>
    );
}
