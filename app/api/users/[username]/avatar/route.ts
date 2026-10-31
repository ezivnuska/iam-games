// app/api/users/[username]/avatar/route.ts

import { NextResponse } from "next/server";

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://iameric.me';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    const res = await fetch(`${MAIN_APP_URL}/api/mobile/users/by-username/${encodeURIComponent(username)}`);
    if (res.status === 404) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ avatar: data.user?.avatar ?? null });
  } catch (err) {
    console.error("Error fetching user avatar:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
