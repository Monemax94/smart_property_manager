'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const checkSession = () => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        if (token && user) {
            router.push('/dashboard');
        }
    };

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            router.replace('/dashboard');
        }
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await axios.post('http://127.0.0.1:8080/api/auth/login', {
                email,
                password,
            });
            // Correctly extract nested data from ApiResponse
            const responseData = res.data.data.data;

            localStorage.setItem('token', responseData.accessToken);
            localStorage.setItem('refreshToken', responseData.refreshToken);
            localStorage.setItem('user', JSON.stringify(responseData.user));

            // Set cookie for server-side availability
            document.cookie = `token=${responseData.accessToken}; path=/; max-age=86400; SameSite=Lax`;

            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        const successRedirect = `${window.location.origin}/auth/success`;
        const failureRedirect = `${window.location.origin}/login?error=google_auth_failed`;
        const backendUrl = 'http://127.0.0.1:8080/api/auth/google-auth';

        window.location.href = `${backendUrl}?successRedirect=${encodeURIComponent(successRedirect)}&failureRedirect=${encodeURIComponent(failureRedirect)}`;
    };

    return (
        <div className="min-h-screen flex bg-white overflow-hidden">
            {/* Left Side: Visual/Branding (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear transform hover:scale-110"
                    style={{ backgroundImage: `url('/auth-bg.png')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/60 to-black/80 mix-blend-multiply" />

                <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full">
                    <div>
                        <Link href="/" className="text-3xl font-black italic tracking-tighter uppercase mb-2 block">
                            SMARTHOME
                        </Link>
                        <div className="w-12 h-1 bg-white/30 rounded-full" />
                    </div>

                    <div className="animate-slideUp">
                        <h2 className="text-6xl font-black mb-6 uppercase tracking-tighter leading-none">
                            Welcome <br />Back to <span className="text-white/50 italic">Elite</span>
                        </h2>
                        <p className="text-xl font-medium opacity-80 leading-relaxed max-w-md">
                            Experience the future of property management with our military-grade security and smart home integration.
                        </p>
                    </div>

                    <div className="flex gap-4 text-xs font-bold tracking-[0.2em] uppercase opacity-40">
                        <span>Lagos</span>
                        <span>•</span>
                        <span>Premium</span>
                        <span>•</span>
                        <span>Smart</span>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/30">
                <div className="w-full max-w-md animate-fadeIn">
                    <div className="text-center mb-10 lg:hidden">
                        <Link href="/" className="text-2xl font-black text-primary italic tracking-tighter uppercase">
                            SMARTHOME
                        </Link>
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100">
                        <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tight">Sign In</h2>
                        <p className="text-gray-500 mb-8 font-medium">
                            Don't have an account?{' '}
                            <Link href="/register" className="text-primary hover:underline font-bold">
                                Create one
                            </Link>
                        </p>

                        <form className="space-y-6" onSubmit={handleLogin}>
                            {error && (
                                <div className="text-red-500 text-sm text-center bg-red-50 p-4 rounded-2xl animate-shake">
                                    {error}
                                </div>
                            )}

                            <div className="animate-fadeIn" style={{ animationDelay: '100ms' }}>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[1.2rem] text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-300 font-medium"
                                />
                            </div>

                            <div className="animate-fadeIn" style={{ animationDelay: '200ms' }}>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 ml-2">Password</label>
                                    <Link href="/forgot-password" title="Forgot Password" className="text-xs font-bold text-primary hover:underline uppercase tracking-tighter">
                                        Forgot?
                                    </Link>
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[1.2rem] text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-300 font-medium"
                                />
                            </div>

                            <div className="pt-2 animate-fadeIn" style={{ animationDelay: '300ms' }}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="group w-full flex items-center justify-center py-5 px-4 bg-gray-900 hover:bg-primary text-white text-sm font-black uppercase tracking-[0.2em] rounded-[1.2rem] shadow-xl transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Sign In
                                            <svg className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="mt-8 animate-fadeIn" style={{ animationDelay: '400ms' }}>
                            <div className="relative mb-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-gray-400">
                                    <span className="px-4 bg-white">Universal Access</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center py-4 border-2 border-gray-100 rounded-[1.2rem] bg-white text-sm font-black uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all hover:border-gray-200"
                            >
                                <img
                                    className="h-5 w-5 mr-3"
                                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                                    alt="Google"
                                />
                                Continue with Google
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
