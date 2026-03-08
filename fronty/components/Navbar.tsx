'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { isTokenExpired, clearSession } from '../utils/auth';

export default function Navbar() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (isTokenExpired(token)) {
            if (token) {
                // Was previously authenticated but now expired
                handleLogout();
            } else {
                setIsAuthenticated(false);
                setUser(null);
            }
        } else {
            setIsAuthenticated(true);
            const userStr = localStorage.getItem('user');
            if (userStr) setUser(JSON.parse(userStr));
        }
    }, [pathname]);

    const handleLogout = () => {
        clearSession();
        setIsAuthenticated(false);
        router.push('/login');
    };

    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center group">
                            <span className="font-black text-2xl text-primary tracking-tighter italic transition-transform group-hover:scale-110">SMARTHOME</span>
                        </Link>
                        <div className="hidden sm:ml-10 sm:flex sm:space-x-10">
                            <Link href="/properties" className="text-gray-900 hover:text-primary inline-flex items-center px-1 pt-1 text-sm font-black uppercase tracking-widest transition-colors">
                                Collection
                            </Link>
                            {isAuthenticated && ['admin', 'superadmin'].includes(user?.role) && (
                                <Link href="/properties/new" className="text-gray-900 hover:text-primary inline-flex items-center px-1 pt-1 text-sm font-black uppercase tracking-widest transition-colors">
                                    List Property
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-6">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-6">
                                <Link href="/dashboard" className="text-gray-500 hover:text-primary text-xs font-black uppercase tracking-widest transition-colors">
                                    Dashboard
                                </Link>
                                <Link href="/profile" className="text-gray-500 hover:text-primary text-xs font-black uppercase tracking-widest transition-colors">
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="bg-black text-white hover:bg-primary px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-primary/20"
                                >
                                    Log Out
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href="/login" className="text-gray-900 hover:text-primary text-xs font-black uppercase tracking-widest px-4 transition-colors">
                                    Sign In
                                </Link>
                                <Link href="/register" className="bg-primary hover:bg-black text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 transform hover:-translate-y-0.5">
                                    Join Elite
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
