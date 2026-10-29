// app/api/auth/signout/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GAMES_SESSION_COOKIE } from '@/app/lib/utils/auth';

export async function POST(req: NextRequest): Promise<Response> {
    const isProduction = process.env.NODE_ENV === 'production';
    const res = NextResponse.json({ url: '/' });
    res.cookies.set(GAMES_SESSION_COOKIE, '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
    });
    return res;
}
