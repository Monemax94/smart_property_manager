'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isTokenExpired, clearSession } from '@/utils/auth';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardActivity from '@/components/dashboard/DashboardActivity';
import DashboardProperties from '@/components/dashboard/DashboardProperties';
import DashboardPayments from '@/components/dashboard/DashboardPayments';

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info' | 'warning' | null, message: string | null }>({
        type: null,
        message: null
    });

    const showAlert = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
        setAlert({ type, message });
        setTimeout(() => setAlert({ type: null, message: null }), 5000);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (isTokenExpired(token)) {
            clearSession();
            router.push('/login');
        } else {
            if (userStr) setUser(JSON.parse(userStr));
            setLoading(false);
        }
    }, [router]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-background">Loading dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-background p-8 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-10 gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight">Dashboard Overview</h1>
                        <p className="text-muted-text font-medium text-xs md:text-sm">Welcome back! Manage your listings and track performance.</p>
                    </div>
                    {['admin', 'superadmin'].includes(user?.role) && (
                        <Link href="/properties/new" className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all active:translate-y-0 text-sm tracking-tight flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            List New Property
                        </Link>
                    )}
                </div>

                {alert.message && alert.type && (
                    <div className={`mb-6 p-4 rounded-xl shadow-lg border ${alert.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
                        alert.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
                            alert.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                'bg-yellow-50 text-yellow-800 border-yellow-200'
                        } transition-all animate-fadeIn flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            <span className="font-bold">{alert.type === 'error' ? 'Error:' : 'Notification:'}</span>
                            <span className="font-medium">{alert.message}</span>
                        </div>
                        <button onClick={() => setAlert({ type: null, message: null })} className="text-xl font-bold opacity-50 hover:opacity-100 transition-opacity">&times;</button>
                    </div>
                )}

                {/* Statistics Cards for Admins */}
                {['admin', 'superadmin'].includes(user?.role) && (
                    <DashboardStats onNotify={showAlert} />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recent Activity Feed */}
                    <div className="lg:col-span-2">
                        <DashboardActivity onNotify={showAlert} />
                    </div>

                    {/* Quick Access Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <DashboardPayments />
                        <div className="bg-card rounded-xl border border-card-border shadow p-6">
                            <h3 className="text-lg leading-6 font-bold text-foreground mb-6 uppercase tracking-widest text-xs opacity-60">Quick Management</h3>
                            <div className="space-y-3">
                                <Link href="/profile" className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-white/5 rounded-xl hover:bg-primary/5 hover:text-primary transition-all group border border-transparent hover:border-primary/20">
                                    <span className="font-bold text-sm">Profile Settings</span>
                                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </Link>
                                <Link href="/properties" className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-white/5 rounded-xl hover:bg-primary/5 hover:text-primary transition-all group border border-transparent hover:border-primary/20">
                                    <span className="font-bold text-sm">Marketplace View</span>
                                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </Link>
                            </div>
                        </div>

                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                            <h4 className="font-bold text-primary mb-2">Need help?</h4>
                            <p className="text-xs text-muted-text font-medium mb-4">Our support team is available 24/7 to assist with your listings.</p>
                            <button className="bg-primary text-white text-xs font-bold py-2 px-4 rounded-lg w-full hover:bg-primary-hover shadow-lg shadow-primary/10">Contact Support</button>
                        </div>
                    </div>
                </div>

                {/* User Managed Properties Table */}
                {['admin', 'superadmin'].includes(user?.role) && (
                    <div className="mt-12 pt-8 border-t border-gray-100">
                        <DashboardProperties onNotify={showAlert} />
                    </div>
                )}
            </div>
        </div>
    );
}
