// app/lib/providers/user-provider.tsx

"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import type { AppUser, User } from "@/app/lib/definitions";
import { UserRole } from "@/app/lib/definitions/user";

function partialUser(session: Pick<AppUser, 'id' | 'username' | 'role'>): User {
    return {
        id: session.id,
        username: session.username,
        role: session.role,
        email: '',
        bio: '',
        avatar: null,
        verified: false,
        createdAt: '',
        updatedAt: '',
    };
}

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
    const [user, setUser] = useState<User | null>(initialUser ? partialUser(initialUser) : null);
    const [token, setToken] = useState<string | null>(null);
    const [status, setStatus] = useState<AuthStatus>(initialUser ? "authenticated" : "unauthenticated");

    const [userCache] = useState<Map<string, User>>(new Map());

    useEffect(() => {
        if (!initialUser) {
            setUser(null);
            setStatus("unauthenticated");
            return;
        }

        // Partial data is already in state — hydrate full profile in the background.
        fetch("/api/users/me")
            .then(res => res.ok ? res.json() : Promise.reject(new Error('fetch failed')))
            .then(async (fullUser: User) => {
                setUser(fullUser);

                const tokenRes = await fetch("/api/auth/session-token");
                if (tokenRes.ok) {
                    const data = await tokenRes.json();
                    setToken(data.token ?? null);
                }

                try {
                    localStorage.removeItem('poker_guest_id');
                    localStorage.removeItem('poker_guest_username');
                    localStorage.removeItem('poker_guest_created_at');
                } catch (e) {
                    console.warn('Failed to clear guest credentials on authentication:', e);
                }
            })
            .catch(err => {
                console.error("Failed to fetch full user:", err);
                setUser(null);
                setStatus("unauthenticated");
            });
    }, [initialUser?.id]);

    const fetchUserById = useCallback(async (id: string): Promise<User | null> => {
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
    }, [userCache]);

    const fetchUserByUsername = useCallback(async (username: string): Promise<User | null> => {
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
    }, [userCache]);

    const signIn = useCallback(() => {
        const mainApp = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://iameric.me'
        const returnUrl = typeof window !== 'undefined' ? window.location.pathname : '/'
        const callbackUrl = encodeURIComponent(`/api/auth/games-token?redirect=${encodeURIComponent(returnUrl)}`)
        window.location.href = `${mainApp}/signin?callbackUrl=${callbackUrl}`
    }, []);

    const signOut = useCallback(async () => {
        setStatus("signing-out");
        try {
            await fetch("/api/auth/signout", { method: "POST" });
        } catch (e) {
            // ignore
        }
        window.location.href = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://iameric.me';
    }, []);

    const value = useMemo(() => ({
        user,
        token,
        status,
        setUser,
        signIn,
        signOut,
        fetchUserById,
        fetchUserByUsername,
    }), [user, token, status, setUser, signIn, signOut, fetchUserById, fetchUserByUsername]);

    return (
        <UserContext.Provider
            value={value}
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
