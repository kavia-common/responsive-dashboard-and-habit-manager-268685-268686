import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';

import {createAuthApi} from '../../api/authApi';

const STORAGE_KEY = 'habit_tracker_auth_v1';

const AuthContext = createContext(null);

function safeParse(json) {
    try {
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
}

// PUBLIC_INTERFACE
export function AuthProvider({children}) {
    /** Provides auth state (token/user) and actions for login/logout/register. */
    const [status, setStatus] = useState('loading');
    const [token, setToken] = useState(null);
    const [user, setUser] = useState(null);
    const authApi = useMemo(() => createAuthApi(() => token), [token]);

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        const stored = raw ? safeParse(raw) : null;

        if (stored && stored.token) {
            setToken(stored.token);
            setUser(stored.user || null);
            setStatus('authenticated');
        } else {
            setStatus('anonymous');
        }
    }, []);

    useEffect(() => {
        if (!token) {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify({token, user}));
    }, [token, user]);

    async function login(email, password) {
        setStatus('loading');
        const resp = await authApi.login(email, password);
        // Expected response shape: {accessToken, user}. Fallbacks included.
        const nextToken = resp && (resp.accessToken || resp.token);
        if (!nextToken) {
            setStatus('anonymous');
            throw new Error('Login succeeded but no access token was returned.');
        }
        setToken(nextToken);
        setUser((resp && resp.user) || {email});
        setStatus('authenticated');
        return resp;
    }

    async function register(payload) {
        setStatus('loading');
        const resp = await authApi.register(payload);
        // Some backends auto-login; others require manual login.
        const nextToken = resp && (resp.accessToken || resp.token);
        if (nextToken) {
            setToken(nextToken);
            setUser(resp.user || payload);
            setStatus('authenticated');
        } else {
            setStatus('anonymous');
        }
        return resp;
    }

    function logout() {
        setToken(null);
        setUser(null);
        setStatus('anonymous');
    }

    const value = useMemo(() => {
        return {
            status,
            token,
            user,
            isAuthenticated: status === 'authenticated',
            login,
            register,
            logout
        };
    }, [status, token, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
    /** Hook to access the current auth state and actions. */
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider.');
    }
    return ctx;
}
