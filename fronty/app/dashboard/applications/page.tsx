'use client';

import { useEffect, useState, Suspense } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import ScheduleMeetingModal from '@/components/dashboard/ScheduleMeetingModal';
import DigitalSignatureModal from '@/components/dashboard/DigitalSignatureModal';

function TenantApplicationsContent() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const reference = searchParams.get('reference') || searchParams.get('trxref');
        if (reference) {
            const verifyPayment = async () => {
                const token = localStorage.getItem('token');
                try {
                    await axios.post('http://127.0.0.1:8080/api/payments/verify', {
                        paymentGateWay: 'paystack',
                        reference: reference
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    alert('Payment verified successfully!');
                    // Refresh applications after verification
                    window.location.href = '/dashboard/applications';
                } catch (err) {
                    console.error('Verification failed', err);
                }
            };
            verifyPayment();
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchApps = async () => {
            const token = localStorage.getItem('token');
            if (!token) return router.push('/login');
            try {
                const res = await axios.get('http://127.0.0.1:8080/api/applications/my-applications', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setApplications(res.data.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchApps();
    }, [router]);

    const handlePay = async (app: any) => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.post(`http://127.0.0.1:8080/api/applications/${app._id}/pay`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.data?.data?.authorization_url) {
                window.location.href = res.data.data.data.authorization_url;
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Payment initiation failed');
        }
    };

    const handleSign = (app: any) => {
        setSelectedAppId(app._id);
        setIsSignModalOpen(true);
    };

    const handleConfirmMeeting = async (appId: string) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`http://127.0.0.1:8080/api/applications/${appId}/confirm-meeting`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Meeting date confirmed!');
            window.location.reload();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to confirm meeting');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto p-6 mt-8">
            <h1 className="text-3xl font-black mb-8 tracking-tight uppercase">My Applications</h1>
            {applications.length === 0 ? (
                <div className="bg-white p-12 rounded-[2rem] shadow-xl text-center border border-gray-100">
                    <p className="text-gray-500 font-medium">You have no applications yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {applications.map((app: any) => (
                        <div key={app._id} className="bg-white p-4 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col md:flex-row gap-6 hover:translate-y-[-4px] transition-all">
                            <div className="relative w-full md:w-48 h-32 rounded-2xl overflow-hidden shrink-0">
                                {app.propertyId?.images?.[0] ? (
                                    <Image
                                        src={app.propertyId.images[0].url}
                                        alt={app.propertyId.title}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                                        No Image
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h2 className="text-xl font-black text-gray-900">{app.propertyId?.title || 'Unknown Property'}</h2>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                app.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                app.status === 'payment_pending' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {app.status}
                                            </span>
                                            <span className="text-xs text-gray-400 font-bold">Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {app.meetingDate && (
                                            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Property Viewing</p>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold text-gray-700">
                                                        {new Date(app.meetingDate).toLocaleString()}
                                                    </p>
                                                    {app.meetingStatus === 'pending' && app.proposedBy === 'agent' ? (
                                                        <button 
                                                            onClick={() => handleConfirmMeeting(app._id)}
                                                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-black transition-colors bg-white px-3 py-1 rounded-md shadow-sm border border-primary/20"
                                                        >
                                                            Confirm Date
                                                        </button>
                                                    ) : (
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${app.meetingStatus === 'confirmed' ? 'text-green-600' : 'text-gray-400'}`}>
                                                            {app.meetingStatus}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        {app.status === 'payment_pending' && app.paymentStatus !== 'completed' && (
                                            <button onClick={() => handlePay(app)} className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
                                                Make Payment
                                            </button>
                                        )}
                                        {app.status === 'payment_pending' && app.paymentStatus === 'completed' && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 italic">
                                                <span className="text-xs font-black uppercase tracking-widest">Payment Verified. Awaiting Legal Agreement.</span>
                                            </div>
                                        )}
                                        {app.status === 'agreement_sent' && (
                                            <div className="flex flex-col gap-2">
                                                <a href={app.agreementDocumentUrl} target="_blank" rel="noreferrer" className="text-xs font-black uppercase tracking-widest text-primary hover:underline text-center">View Document</a>
                                                <button onClick={() => handleSign(app)} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20">
                                                    Sign Agreement
                                                </button>
                                            </div>
                                        )}
                                        {app.status === 'completed' && (
                                            <div className="flex flex-col gap-2 items-center">
                                                {app.agreementDocumentUrl && (
                                                    <a href={app.agreementDocumentUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline mb-1">View Signed Agreement</a>
                                                )}
                                                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                                    <span className="text-xs font-black uppercase tracking-widest">Occupied</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ScheduleMeetingModal
                isOpen={isMeetingModalOpen}
                onClose={() => setIsMeetingModalOpen(false)}
                applicationId={selectedAppId || ''}
                role="tenant"
                onSuccess={(msg) => console.log(msg)}
            />

            <DigitalSignatureModal
                isOpen={isSignModalOpen}
                onClose={() => setIsSignModalOpen(false)}
                applicationId={selectedAppId || ''}
                onSuccess={(msg) => console.log(msg)}
            />
        </div>
    );
}

export default function TenantApplications() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <TenantApplicationsContent />
        </Suspense>
    );
}
