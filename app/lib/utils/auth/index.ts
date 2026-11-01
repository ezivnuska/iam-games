// app/lib/utils/auth/index.ts

import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { UserRole } from '@/app/lib/definitions/user';
import { decodeNextAuthCookie } from './nextauth';

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

    // Try GAMES_JWT first (set by the redirect-based SSO handoff)
    const gamesToken = cookieStore.get(GAMES_SESSION_COOKIE)?.value;
    if (gamesToken) {
        try {
            const { payload } = await jwtVerify(gamesToken, getSecret());
            const id = payload.id as string;
            if (!id) throw new Error('Unauthorized');
            return {
                id,
                username: payload.username as string,
                role: (payload.role as UserRole) ?? UserRole.User,
            };
        } catch (e) {
            if (e instanceof Error && e.message === 'Unauthorized') throw e;
            // Token invalid/expired — fall through to NextAuth check
        }
    }

    // Fall back to the shared NextAuth cookie from iameric.me (.iameric.me domain)
    const user = await decodeNextAuthCookie(cookieStore);
    if (user) return user;

    throw new Error('Unauthorized');
}

export async function getSessionUser(): Promise<SessionUser | null> {
    try {
        return await requireAuth();
    } catch {
        return null;
    }
}
