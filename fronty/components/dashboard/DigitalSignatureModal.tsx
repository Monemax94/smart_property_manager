'use client';
import React, { useState } from 'react';
import axios from 'axios';

interface DigitalSignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    applicationId: string;
    onSuccess: (message: string) => void;
}

export default function DigitalSignatureModal({ isOpen, onClose, applicationId, onSuccess }: DigitalSignatureModalProps) {
    const [signature, setSignature] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!signature) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://127.0.0.1:8080/api/applications/${applicationId}/sign`, { 
                digitalSignature: signature 
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSuccess('Agreement signed successfully!');
            onClose();
            window.location.reload();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to sign agreement');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-[2rem] p-8 w-[95%] max-w-md shadow-2xl relative overflow-hidden animate-slideUp">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Sign Agreement</h2>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Type your full name as signature</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Digital Signature</label>
                        <input
                            type="text"
                            required
                            placeholder="John Doe"
                            value={signature}
                            onChange={(e) => setSignature(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 transition-all outline-none italic"
                            style={{ fontFamily: 'var(--font-outfit)' }}
                        />
                    </div>

                    <div className="p-4 bg-green-50 rounded-2xl border border-green-100 italic text-[10px] text-green-700">
                        By typing your name, you agree that this is a legally binding digital signature and you accept the terms of the rental agreement.
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 bg-gray-100 text-gray-500 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !signature}
                            className="flex-1 px-6 py-4 bg-green-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-green-700 shadow-xl shadow-green-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing...' : 'Sign Now'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
