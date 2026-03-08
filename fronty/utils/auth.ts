export const isTokenExpired = (token: string | null): boolean => {
    if (!token) return true;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const payload = JSON.parse(jsonPayload);
        if (!payload.exp) return false;

        // Check if exp timestamp (in seconds) is in the past
        // Note: Buffer it by 5 seconds for network latency
        return (Date.now() / 1000) >= (payload.exp - 5);
    } catch (error) {
        return true;
    }
};

export const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // Clear cookie
    document.cookie = 'token=; Max-Age=0; path=/; SameSite=Lax;';
};
