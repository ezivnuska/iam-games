// app/api/users/me/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import { GAMES_SESSION_COOKIE } from "@/app/lib/utils/auth";
import { decodeNextAuthCookie } from "@/app/lib/utils/auth/nextauth";

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://iameric.me';

function getGamesSecret(): Uint8Array {
    return new TextEncoder().encode(process.env.GAMES_TOKEN_SECRET ?? '');
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        let token = cookieStore.get(GAMES_SESSION_COOKIE)?.value;

        if (!token) {
            // No GAMES_JWT — try the shared NextAuth cookie from iameric.me
            const user = await decodeNextAuthCookie(cookieStore);
            if (!user) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            // Mint a short-lived proxy token so the iam-next-mongo Hono middleware accepts it
            token = await new SignJWT({ id: user.id, username: user.username, role: user.role })
                .setProtectedHeader({ alg: 'HS256' })
                .setIssuedAt()
                .setExpirationTime('1m')
                .sign(getGamesSecret());
        }

        const res = await fetch(`${MAIN_APP_URL}/api/mobile/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!res.ok) {
            return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
        }

        const data = await res.json();
        return NextResponse.json(data.user);
    } catch (err) {
        console.error("Failed to fetch full user:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
