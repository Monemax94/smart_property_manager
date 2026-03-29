'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'tenant' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [token, setToken] = useState('');

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

    const handleRegisterStart = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('http://127.0.0.1:8080/api/auth/register-start', { email: formData.email });
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to start registration');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyToken = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('http://127.0.0.1:8080/api/auth/verify', { email: formData.email, token });
            setStep(3);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid token');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterComplete = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await axios.post('http://127.0.0.1:8080/api/auth/register', formData);
            router.push('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed');
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
            {/* Left Side: Visual/Branding */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear transform hover:scale-110"
                    style={{ backgroundImage: `url('/auth-bg.png')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/70 to-black/90 mix-blend-multiply" />

                <div className="relative z-10 flex flex-col justify-between p-12 text-white h-full">
                    <div>
                        <Link href="/" className="text-3xl font-black italic tracking-tighter uppercase mb-2 block animate-fadeIn">
                            SMARTHOME
                        </Link>
                        <div className="w-12 h-1 bg-white/30 rounded-full animate-fadeIn" />
                    </div>

                    <div className="animate-slideUp">
                        <span className="text-primary font-black uppercase tracking-[0.4em] text-xs sm:text-sm mb-4 block">Joining The Elite</span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 uppercase tracking-tighter leading-none">
                            Secure Your <br /><span className="text-white/50 italic">Digital</span> Space
                        </h2>
                        <p className="text-xl font-medium opacity-80 leading-relaxed max-w-sm">
                            Join thousands of property owners and tenants who trust our autonomous living ecosystem.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 animate-fadeIn">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-800 flex items-center justify-center text-[10px] font-bold">
                                    {String.fromCharCode(64 + i)}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-60">
                            Trusted by 12k+ users
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side: Registration Steps */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50/30 overflow-y-auto">
                <div className="w-full max-w-md my-auto">
                    <div className="text-center mb-8 lg:hidden">
                        <Link href="/" className="text-2xl font-black text-primary italic tracking-tighter uppercase">
                            SMARTHOME
                        </Link>
                    </div>

                    <div className="bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 animate-fadeIn">
                        <div className="flex items-center justify-between mb-6 md:mb-8">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">Register</h2>
                                <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">Step {step} of 3</p>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-6 bg-primary' : 'w-2 bg-gray-100'}`} />
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm text-center bg-red-50 p-4 rounded-2xl mb-6 animate-shake">
                                {error}
                            </div>
                        )}

                        {step === 1 && (
                            <div className="animate-fadeIn">
                                <form className="space-y-6" onSubmit={handleRegisterStart}>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Email Address</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="your@email.com"
                                            className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[1.2rem] text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-300 font-medium"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="group w-full flex items-center justify-center py-5 px-4 bg-gray-900 hover:bg-primary text-white text-sm font-black uppercase tracking-[0.2em] rounded-[1.2rem] shadow-xl transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50"
                                        >
                                            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Get Started'}
                                        </button>
                                    </div>
                                </form>

                                <div className="mt-8">
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-100"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase font-black tracking-widest text-gray-400">
                                            <span className="px-4 bg-white">Instant Sync</span>
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
                                <div className="mt-8 pt-8 border-t border-gray-100">
                                    <p className="text-center text-gray-500 font-medium text-sm">
                                        Already have an account?{' '}
                                        <Link href="/login" className="text-primary font-black uppercase tracking-widest hover:underline">
                                            OR SIGN IN HERE
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <form className="space-y-6 animate-fadeIn" onSubmit={handleVerifyToken}>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Verification Code</label>
                                    <input
                                        type="text"
                                        required
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="Enter 6-digit code"
                                        className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[1.2rem] text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all placeholder-gray-300 font-medium tracking-[0.5em] text-center text-lg"
                                    />
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3 text-center">We sent a code to {formData.email}</p>
                                </div>
                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center py-5 px-4 bg-gray-900 hover:bg-primary text-white text-sm font-black uppercase tracking-[0.2em] rounded-[1.2rem] shadow-xl transition-all"
                                    >
                                        {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Verify Code'}
                                    </button>
                                </div>
                                <button type="button" onClick={() => setStep(1)} className="w-full text-center text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors">
                                    Change Email
                                </button>
                            </form>
                        )}

                        {step === 3 && (
                            <form className="space-y-4 animate-fadeIn" onSubmit={handleRegisterComplete}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1 ml-2">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="w-full px-5 py-3 bg-gray-50 border-transparent rounded-2xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1 ml-2">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="w-full px-5 py-3 bg-gray-50 border-transparent rounded-2xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1 ml-2">Create Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Min. 8 characters"
                                        className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[1.2rem] text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1 ml-2">Account Type</label>
                                    <select
                                        required
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="w-full px-6 py-4 bg-gray-50 border-transparent rounded-[1.2rem] text-gray-900 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-black uppercase tracking-widest text-xs"
                                    >
                                        <option value="tenant">I am a Tenant</option>
                                        <option value="vendor">I am a Vendor</option>
                                    </select>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center py-5 px-4 bg-gray-900 hover:bg-primary text-white text-sm font-black uppercase tracking-[0.2em] rounded-[1.2rem] shadow-xl transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : 'Complete Registration'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
