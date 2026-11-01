// app/lib/utils/auth/nextauth.ts
// Decodes the NextAuth v5 JWE session cookie from iameric.me.
// Uses the same AUTH_SECRET + cookie-name salt that auth.js uses internally.

import { jwtDecrypt } from 'jose';
import { UserRole } from '@/app/lib/definitions/user';
import type { SessionUser } from './index';

const COOKIE_NAME_PROD = '__Secure-next-auth.session-token';
const COOKIE_NAME_DEV = 'next-auth.session-token';

export function getNextAuthCookieName(): string {
    return process.env.NODE_ENV === 'production' ? COOKIE_NAME_PROD : COOKIE_NAME_DEV;
}

async function deriveKey(secret: string, salt: string): Promise<Uint8Array> {
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        'HKDF',
        false,
        ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: new TextEncoder().encode(salt),
            info: new TextEncoder().encode(`Auth.js Generated Encryption Key (${salt})`),
        },
        keyMaterial,
        256,
    );
    return new Uint8Array(bits);
}

type CookieStore = { get: (name: string) => { value: string } | undefined };

export async function decodeNextAuthCookie(cookieStore: CookieStore): Promise<SessionUser | null> {
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) return null;

    const cookieName = getNextAuthCookieName();
    const tokenValue = cookieStore.get(cookieName)?.value;
    if (!tokenValue) return null;

    try {
        const key = await deriveKey(secret, cookieName);
        const { payload } = await jwtDecrypt(tokenValue, key, { clockTolerance: 15 });

        const id = payload.id as string | undefined;
        const username = payload.username as string | undefined;
        const role = payload.role as UserRole | undefined;

        if (!id || !username) return null;
        return { id, username, role: role ?? UserRole.User };
    } catch {
        return null;
    }
}
