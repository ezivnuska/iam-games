// app/api/auth/session-token/route.ts
// Issues a short-lived JWT for socket authentication.

import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { requireAuth } from '@/app/lib/utils/auth';

function getSecret(): Uint8Array {
    return new TextEncoder().encode(process.env.GAMES_TOKEN_SECRET ?? '');
}

export async function GET(): Promise<Response> {
    try {
        const user = await requireAuth();

        const token = await new SignJWT({ id: user.id, username: user.username, role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('30m')
            .sign(getSecret());

        return NextResponse.json({ token });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.error('[session-token] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
