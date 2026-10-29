// app/lib/utils/auth/index.ts

import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { UserRole } from '@/app/lib/definitions/user';

export const GAMES_SESSION_COOKIE = 'iam-games-session';

export interface SessionUser {
    id: string;
    username: string;
    role: UserRole;
}

function getSecret(): Uint8Array {
    return new TextEncoder().encode(process.env.GAMES_TOKEN_SECRET ?? '');
}

export async function requireAuth(): Promise<SessionUser> {
    const cookieStore = await cookies();
    const token = cookieStore.get(GAMES_SESSION_COOKIE)?.value;
    if (!token) throw new Error('Unauthorized');

    try {
        const { payload } = await jwtVerify(token, getSecret());
        const id = payload.id as string;
        if (!id) throw new Error('Unauthorized');
        return {
            id,
            username: payload.username as string,
            role: (payload.role as UserRole) ?? UserRole.User,
        };
    } catch {
        throw new Error('Unauthorized');
    }
}

export async function getSessionUser(): Promise<SessionUser | null> {
    try {
        return await requireAuth();
    } catch {
        return null;
    }
}
