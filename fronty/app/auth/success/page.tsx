'use client';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

function AuthSuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const accessTokenFromQuery = searchParams.get('accessToken');

    useEffect(() => {
        if (accessTokenFromQuery) {
            handleGoogleAuth(accessTokenFromQuery);
        } else {
            router.push('/login?error=no_token');
        }
    }, [accessTokenFromQuery, router]);

    const handleGoogleAuth = async (token: string) => {
        try {
            const res = await axios.post('http://127.0.0.1:8080/api/auth/google-auth', {
                token: token
            });

            // Extract data from ApiResponse
            // According to ApiResponse.ts, it's res.data.data.data
            const responseData = res.data.data.data;

            localStorage.setItem('token', responseData.accessToken);
            localStorage.setItem('refreshToken', responseData.refreshToken);
            localStorage.setItem('user', JSON.stringify(responseData.user));

            // Set cookie for server-side availability
            document.cookie = `token=${responseData.accessToken}; path=/; max-age=86400; SameSite=Lax`;

            router.push('/dashboard');
        } catch (err: any) {
            console.error('Google auth error:', err);
            router.push('/login?error=google_auth_failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary border-t-transparent mx-auto"></div>
                <h2 className="mt-4 text-xl font-semibold text-gray-700">Authenticating...</h2>
                <p className="text-gray-500">Please wait while we log you in.</p>
            </div>
        </div>
    );
}

export default function AuthSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary border-t-transparent mx-auto"></div>
                    <h2 className="mt-4 text-xl font-semibold text-gray-700">Loading...</h2>
                </div>
            </div>
        }>
            <AuthSuccessContent />
        </Suspense>
    );
}
