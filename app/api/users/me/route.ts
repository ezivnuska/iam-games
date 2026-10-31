// app/api/users/me/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { GAMES_SESSION_COOKIE } from "@/app/lib/utils/auth";

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://iameric.me';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(GAMES_SESSION_COOKIE)?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
