'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { clearSession, isTokenExpired } from '@/utils/auth';

interface DashboardStatsData {
    total: number;
    active: number;
    inactive: number;
    featured: number;
    premium: number;
    avgPrice: number;
}

interface DashboardStatsProps {
    onNotify?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export default function DashboardStats({ onNotify }: DashboardStatsProps) {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            const token = localStorage.getItem('token');
            if (!token || isTokenExpired(token)) {
                clearSession();
                router.push('/login');
                return;
            }

            try {
                const res = await axios.get('http://127.0.0.1:8080/api/properties/statistics', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data?.data?.data || null);
            } catch (err: any) {
                console.error('Failed to fetch stats', err);
                if (err.response?.status === 401) {
                    clearSession();
                    router.push('/login');
                    return;
                }
                if (onNotify) {
                    onNotify('error', err.response?.data?.message || 'Failed to fetch dashboard statistics');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card h-32 rounded-lg border border-card-border shadow-sm"></div>
                ))}
            </div>
        );
    }

    const statCards = [
        { label: 'Total Properties', value: stats?.total || 0, trend: 'Managed by you', color: 'border-primary' },
        { label: 'Active Listings', value: stats?.active || 0, trend: 'Live on market', color: 'border-green-500' },
        { label: 'Featured', value: stats?.featured || 0, trend: 'Premium visibility', color: 'border-yellow-500' },
        { label: 'Average Price', value: `$${stats?.avgPrice?.toLocaleString() || 0}`, trend: 'Market value', color: 'border-blue-500' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, i) => (
                <div key={i} className={`bg-card rounded-lg shadow-sm p-6 border-l-4 ${stat.color} transition-all duration-300 hover:shadow-md`}>
                    <p className="text-sm font-medium text-muted-text mb-1">{stat.label}</p>
                    <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                    <p className="text-xs text-muted-text mt-2 font-medium tracking-wide uppercase">{stat.trend}</p>
                </div>
            ))}
        </div>
    );
}
