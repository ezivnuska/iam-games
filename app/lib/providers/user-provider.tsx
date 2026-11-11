// app/lib/providers/user-provider.tsx

"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { AppUser, User } from "@/app/lib/definitions";
import { UserRole } from "@/app/lib/definitions/user";

type AuthStatus = "loading" | "authenticated" | "unauthenticated" | "signing-out";

export function createGuestUser(): User {
    const { generateGuestId } = require('@/app/games/poker/lib/utils/guest-utils');

    return {
        id: generateGuestId(),
        username: 'Guest',
        email: '',
        role: UserRole.User,
        bio: '',
        avatar: null,
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isGuest: true,
    };
}

interface UserContextValue {
    user: User | null;
    token: string | null;
    status: AuthStatus;
    setUser: (u: User | null) => void;
    signIn: () => void;
    signOut: () => Promise<void>;
    fetchUserById: (id: string) => Promise<User | null>;
    fetchUserByUsername: (username: string) => Promise<User | null>;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

interface UserProviderProps {
    children: React.ReactNode;
    // Session token only carries id/username/role — full User is fetched on mount
    initialUser: Pick<AppUser, 'id' | 'username' | 'role'> | null;
}

export function UserProvider({ children, initialUser }: UserProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [status, setStatus] = useState<AuthStatus>("loading");

    const [userCache] = useState<Map<string, User>>(new Map());

    useEffect(() => {
        async function fetchFullUser() {
            if (!initialUser) {
                setUser(null);
                setStatus("unauthenticated");
                return;
            }

            setStatus("loading");
            try {
                const res = await fetch("/api/users/me");
                if (!res.ok) {
                    setUser(null);
                    setStatus("unauthenticated");
                    return;
                }
                const fullUser: User = await res.json();
                setUser(fullUser);

                // Fetch socket auth token before marking authenticated so the
                // socket registers with a valid token on first connect.
                const tokenRes = await fetch("/api/auth/session-token");
                if (tokenRes.ok) {
                    const data = await tokenRes.json();
                    setToken(data.token ?? null);
                }

                setStatus("authenticated");

                try {
                    localStorage.removeItem('poker_guest_id');
                    localStorage.removeItem('poker_guest_username');
                    localStorage.removeItem('poker_guest_created_at');
                } catch (e) {
                    console.warn('Failed to clear guest credentials on authentication:', e);
                }
            } catch (err) {
                console.error("Failed to fetch full user:", err);
                setUser(null);
                setStatus("unauthenticated");
            }
        }

        fetchFullUser();
    }, [initialUser]);

    async function fetchUserById(id: string): Promise<User | null> {
        if (userCache.has(id)) return userCache.get(id)!;

        try {
            const res = await fetch(`/api/users/by-id/${id}`);
            if (!res.ok) throw new Error("Failed to fetch user profile");
            const data: User = await res.json();
            userCache.set(id, data);
            return data;
        } catch (err) {
            console.error("fetchUserById error:", err);
            return null;
        }
    }

    async function fetchUserByUsername(username: string): Promise<User | null> {
        if (userCache.has(username)) return userCache.get(username)!;

        try {
            const res = await fetch(`/api/users/${username}`);
            if (!res.ok) throw new Error(`Failed to fetch user profile (username: ${username})`);
            const data: User = await res.json();
            userCache.set(username, data);
            return data;
        } catch (err) {
            console.error("fetchUserByUsername error:", err);
            return null;
        }
    }

    function signIn() {
        const mainApp = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://iameric.me'
        const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/'
        // After login, iam-next-mongo redirects to /api/auth/games-token which
        // signs a short-lived GAMES_TOKEN_SECRET JWT and hands off to this app.
        const callbackUrl = encodeURIComponent(`/api/auth/games-token?redirect=${encodeURIComponent(returnUrl)}`)
        window.location.href = `${mainApp}/signin?callbackUrl=${callbackUrl}`
    }

    async function signOut() {
        setStatus("signing-out");
        try {
            await fetch("/api/auth/signout", { method: "POST" });
        } catch (e) {
            // ignore
        }
        window.location.href = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://iameric.me';
    }

    return (
        <UserContext.Provider
            value={{
                user,
                token,
                status,
                setUser,
                signIn,
                signOut,
                fetchUserById,
                fetchUserByUsername,
            }}
        >
            {["authenticated", "unauthenticated", "signing-out"].includes(status) ? children : null}
        </UserContext.Provider>
    );
}

export function useUser() {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be used within UserProvider");
    return ctx;
}
