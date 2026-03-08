'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { clearSession, isTokenExpired } from '@/utils/auth';
import { formatDistanceToNow } from 'date-fns';

interface ActivityLog {
    _id: string;
    title: string;
    description: string;
    createdAt: string;
    activityType: string;
}

interface DashboardActivityProps {
    onNotify?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export default function DashboardActivity({ onNotify }: DashboardActivityProps) {
    const router = useRouter();
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivities = async () => {
            const token = localStorage.getItem('token');
            if (!token || isTokenExpired(token)) {
                clearSession();
                router.push('/login');
                return;
            }
            try {
                const res = await axios.get('http://127.0.0.1:8080/api/profile/activity/logs', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const activityData = res.data?.data?.data || [];
                setActivities(Array.isArray(activityData) ? activityData.slice(0, 5) : []);
            } catch (err: any) {
                console.error('Failed to fetch activities', err);
                if (err.response?.status === 401) {
                    clearSession();
                    router.push('/login');
                    return;
                }
                if (onNotify) {
                    onNotify('error', err.response?.data?.message || 'Failed to fetch recent activities');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchActivities();
    }, []);

    if (loading) {
        return (
            <div className="bg-card rounded-xl border border-card-border shadow animate-pulse h-64">
            </div>
        );
    }

    return (
        <div className="bg-card rounded-xl border border-card-border shadow overflow-hidden">
            <div className="px-6 py-5 border-b border-card-border">
                <h3 className="text-lg leading-6 font-bold text-foreground tracking-tight">Recent Activity</h3>
            </div>
            <ul className="divide-y divide-card-border">
                {activities.length > 0 ? (
                    activities.map((item) => (
                        <li key={item._id} className="px-6 py-4 hover:bg-gray-50/5 dark:hover:bg-white/5 transition-colors">
                            <div className="flex space-x-3">
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-primary">{item.title}</h3>
                                        <p className="text-xs text-muted-text">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</p>
                                    </div>
                                    <p className="text-sm text-muted-text font-medium">{item.description}</p>
                                </div>
                            </div>
                        </li>
                    ))
                ) : (
                    <li className="px-6 py-12 text-center text-muted-text font-medium">No recent activities found</li>
                )}
            </ul>
        </div>
    );
}
