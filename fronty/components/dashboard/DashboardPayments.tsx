'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { isTokenExpired, clearSession } from '@/utils/auth';
import { useRouter } from 'next/navigation';

interface Transaction {
    _id: string;
    property?: { title: string };
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    transactID?: string;
}

export default function DashboardPayments() {
    const router = useRouter();
    const [payments, setPayments] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            const token = localStorage.getItem('token');
            if (isTokenExpired(token)) {
                clearSession();
                router.push('/login');
                return;
            }

            try {
                const res = await axios.get('http://127.0.0.1:8080/api/payments/history?limit=5', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Correct nested paginated structure: res.data (ApiResponse) -> .data (Wrapper) -> .data (Array)
                setPayments(res.data.data.data || []);
            } catch (err: any) {
                console.error('Failed to fetch dashboard payments', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [router]);

    if (loading) {
        return <div className="bg-card rounded-xl border border-card-border shadow p-6 animate-pulse h-64" />;
    }

    return (
        <div className="bg-card rounded-xl border border-card-border shadow overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-card-border flex justify-between items-center bg-gray-50/10">
                <h3 className="text-lg leading-6 font-bold text-foreground tracking-tight">Recent Transactions</h3>
                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded tracking-widest uppercase">Live</span>
            </div>
            <div>
                {payments.length > 0 ? (
                    <table className="w-full text-left text-sm">
                        <thead className="text-[10px] text-muted-text uppercase font-bold tracking-widest bg-gray-50/30">
                            <tr>
                                <th className="px-6 py-3">Property</th>
                                <th className="px-6 py-3 text-right">Amount</th>
                                <th className="px-6 py-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-card-border">
                            {payments.map((tx) => (
                                <tr key={tx._id} className="hover:bg-gray-50/5 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-foreground text-xs truncate max-w-[150px]">{tx.property?.title || 'Rent Payment'}</p>
                                        <p className="text-[9px] text-muted-text font-mono mt-0.5 opacity-60 uppercase">{tx.transactID || tx._id.substring(0, 8)}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="font-black text-foreground">{tx.currency} {tx.amount.toLocaleString()}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            tx.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-text">
                        <svg className="w-8 h-8 opacity-20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                        <p className="text-sm font-medium">No recent transactions</p>
                    </div>
                )}
            </div>
            <div className="px-6 py-3 bg-gray-50/30 text-center border-t border-card-border">
                <button
                    onClick={() => router.push('/profile')}
                    className="text-[10px] font-black text-gray-400 hover:text-primary transition-colors uppercase tracking-widest"
                >
                    View All Activity
                </button>
            </div>
        </div>
    );
}
