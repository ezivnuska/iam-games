import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { decodeNextAuthCookie } from '@/app/lib/utils/auth/nextauth';

const GAMES_SESSION_COOKIE = 'iam-games-session';

function getGamesSecret(): Uint8Array | null {
    const secret = process.env.GAMES_TOKEN_SECRET;
    if (!secret) return null;
    return new TextEncoder().encode(secret);
}

async function isAuthenticated(req: NextRequest): Promise<boolean> {
    const gamesToken = req.cookies.get(GAMES_SESSION_COOKIE)?.value;
    if (gamesToken) {
        const secret = getGamesSecret();
        if (secret) {
            try {
                await jwtVerify(gamesToken, secret);
                return true;
            } catch {
                // expired or invalid — fall through to NextAuth check
            }
        }
    }

    // Fall back to the shared NextAuth cookie from iameric.me
    const user = await decodeNextAuthCookie(req.cookies);
    return user !== null;
}

export async function middleware(req: NextRequest) {
    // GET /api/tiles/scores is a public leaderboard — only POST/DELETE need auth
    if (req.nextUrl.pathname === '/api/tiles/scores' && req.method === 'GET') {
        return NextResponse.next();
    }

    if (!(await isAuthenticated(req))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/auth/session-token',
        '/api/poker/delete',
        '/api/poker/reset-singleton',
        '/api/tiles/scores',
    ],
};
