// app/api/auth/verify/route.ts
// Receives a token from iameric.me, verifies it, sets the games session cookie.

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { GAMES_SESSION_COOKIE } from '@/app/lib/utils/auth';

function getSecret(): Uint8Array {
    return new TextEncoder().encode(process.env.GAMES_TOKEN_SECRET ?? '');
}

export async function POST(req: NextRequest): Promise<Response> {
    try {
        const { token } = await req.json();
        if (!token) {
            return NextResponse.json({ error: 'Token required' }, { status: 400 });
        }

        const { payload } = await jwtVerify(token, getSecret());

        const id = payload.id as string;
        if (!id) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Issue a session cookie (24h)
        const sessionToken = await new SignJWT({
            id,
            username: payload.username,
            role: payload.role,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(getSecret());

        const isProduction = process.env.NODE_ENV === 'production';
        const res = NextResponse.json({ success: true });
        res.cookies.set(GAMES_SESSION_COOKIE, sessionToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24,
        });

        return res;
    } catch (err) {
        console.error('[verify] Error:', err);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

// GET: redirect-based handoff — token arrives as query param, sets cookie, redirects home
export async function GET(req: NextRequest): Promise<Response> {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
        return NextResponse.redirect(new URL('/', req.url));
    }

    try {
        const { payload } = await jwtVerify(token, getSecret());
        const id = payload.id as string;
        if (!id) throw new Error('Invalid token');

        const sessionToken = await new SignJWT({
            id,
            username: payload.username,
            role: payload.role,
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(getSecret());

        const isProduction = process.env.NODE_ENV === 'production';
        const raw = req.nextUrl.searchParams.get('redirect') || '/';
        const redirectTo = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
        const res = NextResponse.redirect(new URL(redirectTo, req.url));
        res.cookies.set(GAMES_SESSION_COOKIE, sessionToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24,
        });

        return res;
    } catch (err) {
        console.error('[verify GET] Error:', err);
        return NextResponse.redirect(new URL('/', req.url));
    }
}
