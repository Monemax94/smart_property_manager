'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ScheduleMeetingModal from '@/components/dashboard/ScheduleMeetingModal';
import SendAgreementModal from '@/components/dashboard/SendAgreementModal';

export default function AgentApplications() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
    const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchApps = async () => {
            const token = localStorage.getItem('token');
            if (!token) return router.push('/login');
            try {
                const res = await axios.get('http://127.0.0.1:8080/api/applications/agent-applications', {
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

    const handleApprove = async (appId: string) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`http://127.0.0.1:8080/api/applications/${appId}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Application approved! Tenant will be notified to make payment.');
            window.location.reload();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Approval failed');
        }
    };

    const handleSendAgreement = (appId: string) => {
        setSelectedAppId(appId);
        setIsAgreementModalOpen(true);
    };

    const handleProposeMeeting = (appId: string) => {
        setSelectedAppId(appId);
        setIsMeetingModalOpen(true);
    };

    const handleConfirmMeeting = async (appId: string) => {
        const token = localStorage.getItem('token');
        try {
            await axios.post(`http://127.0.0.1:8080/api/applications/${appId}/confirm-meeting`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Meeting confirmed!');
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
        <div className="max-w-7xl mx-auto p-6 mt-8">
            <h1 className="text-3xl font-black mb-8 tracking-tight uppercase">Received Applications</h1>
            {applications.length === 0 ? (
                <div className="bg-white p-12 rounded-[2rem] shadow-xl text-center border border-gray-100">
                    <p className="text-gray-500 font-medium">No applications received yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {applications.map((app: any) => (
                        <div key={app._id} className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col lg:flex-row gap-8 hover:translate-y-[-4px] transition-all">
                            <div className="relative w-full lg:w-64 h-48 rounded-2xl overflow-hidden shrink-0">
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
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black text-gray-900">{app.propertyId?.title || 'Unknown Property'}</h2>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        app.status === 'completed' ? 'bg-green-100 text-green-700' :
                                        app.status === 'payment_pending' ? 'bg-blue-100 text-blue-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {app.status}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Applicant Profile</p>
                                        <p className="text-sm font-bold text-gray-800">{app.personalInfo?.fullName}</p>
                                        <p className="text-xs text-gray-500">{app.personalInfo?.phone}</p>
                                        <p className="text-xs text-gray-500">{app.employmentInfo?.jobTitle} @ {app.employmentInfo?.employerName}</p>
                                        <p className="text-xs text-primary font-black">{app.employmentInfo?.monthlyIncome?.toLocaleString()} NGN / month</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Process Tracking</p>
                                        <p className="text-xs text-gray-500">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                                        {app.meetingDate && (
                                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-gray-400">Meeting Info</p>
                                                    <p className="text-xs font-bold text-gray-800">{new Date(app.meetingDate).toLocaleString()}</p>
                                                </div>
                                                {app.meetingStatus === 'pending' && app.proposedBy === 'tenant' ? (
                                                    <button 
                                                        onClick={() => handleConfirmMeeting(app._id)}
                                                        className="text-[10px] font-black uppercase tracking-widest text-[#8b0000] hover:text-black transition-all bg-white px-3 py-1 rounded-md shadow-sm border border-[#8b0000]/20"
                                                    >
                                                        Confirm
                                                    </button>
                                                ) : (
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${app.meetingStatus === 'confirmed' ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {app.meetingStatus}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-gray-400">Payment:</span>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${app.paymentStatus === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                                                {app.paymentStatus || 'pending'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-3 justify-center min-w-[200px]">
                                {app.status === 'pending' && (
                                    <>
                                        <button 
                                            onClick={() => handleProposeMeeting(app._id)}
                                            className="w-full bg-white text-primary border-2 border-primary py-3 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-primary/5 transition-all"
                                        >
                                            Schedule Viewing
                                        </button>
                                        <button 
                                            onClick={() => handleApprove(app._id)}
                                            className="w-full bg-primary text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-primary/20"
                                        >
                                            Approve & Request Payment
                                        </button>
                                    </>
                                )}
                                {app.status === 'payment_pending' && app.paymentStatus === 'completed' && (
                                    <button 
                                        onClick={() => handleSendAgreement(app._id)}
                                        className="w-full bg-primary text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-primary/20"
                                    >
                                        Send Agreement
                                    </button>
                                )}
                                {app.status === 'completed' && (
                                    <div className="flex flex-col items-center gap-1 p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100">
                                        <svg className="w-6 h-6 mb-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Successfully Rented</span>
                                        {app.agreementDocumentUrl && (
                                            <a href={app.agreementDocumentUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black text-primary hover:underline mt-1">View Signed Agreement</a>
                                        )}
                                        <span className="text-[10px] opacity-70">Signed: {new Date(app.signedAt).toLocaleDateString()}</span>
                                    </div>
                                )}
                                {app.status === 'payment_pending' && app.paymentStatus !== 'completed' && (
                                    <div className="w-full py-4 text-center text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl text-[10px] uppercase tracking-widest">
                                        Awaiting Payment
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ScheduleMeetingModal
                isOpen={isMeetingModalOpen}
                onClose={() => setIsMeetingModalOpen(false)}
                applicationId={selectedAppId || ''}
                role="agent"
                onSuccess={(msg) => console.log(msg)}
            />

            <SendAgreementModal
                isOpen={isAgreementModalOpen}
                onClose={() => setIsAgreementModalOpen(false)}
                applicationId={selectedAppId || ''}
                onSuccess={(msg) => console.log(msg)}
            />
        </div>
    );
}
