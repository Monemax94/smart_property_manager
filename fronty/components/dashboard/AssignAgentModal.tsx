'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { clearSession } from '@/utils/auth';
import { useRouter } from 'next/navigation';

interface AssignAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
}

export default function AssignAgentModal({ isOpen, onClose, propertyId, onSuccess, onError }: AssignAgentModalProps) {
    const router = useRouter();
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAgents();
        }
    }, [isOpen]);

    const fetchAgents = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://127.0.0.1:8080/api/users/agents', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // The response uses ApiResponse: res.data.data
            setAgents(res.data.data || []);
        } catch (error: any) {
            console.error(error);
            if (error.response?.status === 401) {
                clearSession();
                router.push('/login');
            } else {
                onError(error.response?.data?.message || 'Failed to fetch agents');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (agentId: string) => {
        setAssigning(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://127.0.0.1:8080/api/properties/${propertyId}/assign-agent`, { agentId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onSuccess('Agent assigned successfully');
            onClose();
        } catch (error: any) {
            onError(error.response?.data?.message || 'Failed to assign agent');
        } finally {
            setAssigning(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-[2rem] p-8 w-[90%] max-w-lg shadow-2xl relative overflow-hidden animate-slideUp">
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Assign Agent</h2>
                        <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Select an agent for this property</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 relative z-10 scrollbar-thin scrollbar-thumb-gray-200">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : agents.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">No agents available.</p>
                        </div>
                    ) : (
                        agents.map((agent) => (
                            <div key={agent._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-white hover:shadow-lg transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-lg">
                                        {agent.profile?.firstName?.charAt(0) || agent.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">
                                            {agent.profile?.firstName} {agent.profile?.lastName}
                                        </p>
                                        <p className="text-xs font-bold text-gray-500">{agent.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleAssign(agent._id)}
                                    disabled={assigning}
                                    className="px-4 py-2 bg-white border-2 border-gray-100 text-gray-900 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white hover:border-primary transition-all disabled:opacity-50"
                                >
                                    Assign
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
