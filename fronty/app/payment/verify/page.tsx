'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';

export default function PaymentVerifyPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your payment...');
    const verificationAttempted = useRef(false);

    useEffect(() => {
        const reference = searchParams.get('reference');
        if (!reference) {
            setStatus('error');
            setMessage('Invalid payment reference');
            return;
        }

        if (verificationAttempted.current) return;
        verificationAttempted.current = true;

        const verifyPayment = async () => {
            const token = localStorage.getItem('token');
            try {
                const res = await axios.post('http://127.0.0.1:8080/api/payments/verify', {
                    reference,
                    paymentGateWay: 'paystack'
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.success) {
                    setStatus('success');
                    setMessage('Payment verified successfully!');
                    setTimeout(() => router.push('/dashboard'), 3000);
                } else {
                    throw new Error('Verification failed');
                }
            } catch (err: any) {
                console.error('Payment verification failed', err);
                setStatus('error');
                setMessage(err.response?.data?.message || 'Failed to verify payment');
            }
        };

        verifyPayment();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                {status === 'verifying' && (
                    <div className="animate-pulse">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
                        <p className="text-gray-600">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-fadeIn">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <button onClick={() => router.push('/dashboard')} className="px-6 py-2 bg-primary text-white rounded-xl font-bold w-full uppercase tracking-widest text-sm shadow-lg shadow-primary/20">Go to Dashboard</button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="animate-fadeIn">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
                        <p className="text-gray-600 mb-6">{message}</p>
                        <button onClick={() => router.push('/properties')} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold w-full uppercase tracking-widest text-sm">Browse Properties</button>
                    </div>
                )}
            </div>
        </div>
    );
}
