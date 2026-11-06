'use client';

import { useUser } from '@/app/lib/providers/user-provider';

export default function SignInButton() {
    const { signIn } = useUser();

    return (
        <button
            onClick={signIn}
            className='flex items-center justify-center h-10 rounded-full px-4 text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors'
        >
            Sign In
        </button>
    );
}
