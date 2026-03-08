'use client';
import { useEffect } from 'react';
import axios from 'axios';

/**
 * Decodes a JWT and returns seconds until expiry.
 * Returns 0 if token is already expired or invalid.
 */
function getSecondsUntilExpiry(token: string): number {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        if (!payload.exp) return 3600; // Assume 1 hour if no exp
        const secondsLeft = payload.exp - Math.floor(Date.now() / 1000);
        return Math.max(0, secondsLeft);
    } catch {
        return 0;
    }
}

/**
 * SessionManager — mounts globally in the layout.
 * Silently refreshes the access token before it expires,
 * keeping the user logged in without unnecessary logouts.
 */
export default function SessionManager() {
    useEffect(() => {
        let refreshTimer: ReturnType<typeof setTimeout>;

        const scheduleRefresh = (delayMs: number) => {
            clearTimeout(refreshTimer);
            refreshTimer = setTimeout(doRefresh, delayMs);
        };

        const doRefresh = async () => {
            const refreshTokenStr = localStorage.getItem('refreshToken');
            if (!refreshTokenStr) return; // Not logged in, nothing to do

            try {
                const res = await axios.post('http://127.0.0.1:8080/api/auth/refresh-token', {
                    token: refreshTokenStr
                });

                if (res.data?.success || res.data?.data) {
                    // Handle different response shapes
                    const inner = res.data?.data?.data || res.data?.data || res.data;
                    const { accessToken, refreshToken, user } = inner;

                    if (accessToken) {
                        localStorage.setItem('token', accessToken);
                        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
                        if (user) localStorage.setItem('user', JSON.stringify(user));

                        // Update cookie for server-side availability
                        document.cookie = `token=${accessToken}; path=/; max-age=604800; SameSite=Lax`;

                        // Schedule the next refresh at 80% of the new token's lifetime
                        const secondsLeft = getSecondsUntilExpiry(accessToken);
                        const nextRefreshIn = Math.max(60, secondsLeft * 0.8) * 1000;
                        scheduleRefresh(nextRefreshIn);
                    }
                }
            } catch (err: any) {
                const status = err?.response?.status;
                if (status === 401 || status === 403) {
                    // Refresh token is invalid/expired — session truly over
                    // Don't force logout here; let the user naturally get a 401 on next real request
                    console.warn('Session refresh failed — refresh token may have expired.');
                } else {
                    // Network or server error — retry in 2 minutes
                    scheduleRefresh(2 * 60 * 1000);
                }
            }
        };

        // On mount, check how much time is left on the current access token
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');

        if (token && refreshToken) {
            const secondsLeft = getSecondsUntilExpiry(token);
            if (secondsLeft < 300) {
                // Less than 5 minutes left — refresh immediately
                doRefresh();
            } else {
                // Refresh at 80% of the remaining lifetime
                const nextRefreshIn = secondsLeft * 0.8 * 1000;
                scheduleRefresh(nextRefreshIn);
            }
        }

        return () => clearTimeout(refreshTimer);
    }, []);

    return null;
}
