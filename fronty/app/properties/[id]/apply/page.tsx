'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';

export default function ApplyPropertyPage() {
    const { id } = useParams();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [property, setProperty] = useState<any>(null);
    
    // Form state
    const [personalInfo, setPersonalInfo] = useState({ fullName: '', phone: '', dateOfBirth: '', currentAddress: '' });
    const [employmentInfo, setEmploymentInfo] = useState({ employerName: '', jobTitle: '', monthlyIncome: 0, employmentLength: '' });
    const [references, setReferences] = useState([{ name: '', relationship: '', phone: '' }]);

    useEffect(() => {
        if (!id) return;
        const fetchProperty = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:8080/api/properties/${id}`);
                setProperty(res.data.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProperty();
    }, [id]);

    const addReference = () => setReferences([...references, { name: '', relationship: '', phone: '' }]);

    const handleRefChange = (index: number, field: string, value: string) => {
        const newRefs = [...references];
        (newRefs[index] as any)[field] = value;
        setReferences(newRefs);
    };

    const submitApplication = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login first');
            return router.push('/login');
        }

        setLoading(true);
        try {
            await axios.post('http://127.0.0.1:8080/api/applications/apply', {
                propertyId: id,
                personalInfo,
                employmentInfo,
                references
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Application submitted successfully!');
            router.push('/dashboard/applications');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { 
            num: 1, 
            title: 'Personal Info', 
            desc: 'Tell us about yourself',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
        },
        { 
            num: 2, 
            title: 'Employment', 
            desc: 'Income verification',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        },
        { 
            num: 3, 
            title: 'References', 
            desc: 'Trusted contacts',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
        }
    ];

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex font-sans selection:bg-primary selection:text-white">
            {/* Left side: Premium branding & Steps info */}
            <div className="hidden lg:flex lg:w-1/3 relative bg-primary flex-col justify-between overflow-hidden">
                <div className="absolute inset-0 z-0">
                    {property?.images?.[0]?.url ? (
                        <>
                            <Image 
                                src={property.images[0].url} 
                                alt={property.title || 'Property'} 
                                layout="fill" 
                                objectFit="cover" 
                                className="opacity-30 mix-blend-multiply"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/90 to-transparent"></div>
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-[#8b0000]"></div>
                    )}
                </div>

                <div className="relative z-10 p-12 text-white">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-white/80 hover:text-white transition group mb-16">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        <span className="font-medium tracking-wide text-sm uppercase">Back to Property</span>
                    </button>
                    
                    <h1 className="text-4xl font-extrabold tracking-tight mb-2 flex items-center gap-3">
                        <svg className="w-8 h-8 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                        Rental Application
                    </h1>
                    <p className="text-white/80 text-lg ml-11">{property?.title || 'Apply for your new home'}</p>
                </div>
                
                <div className="relative z-10 p-12">
                    <div className="space-y-8">
                        {steps.map((s) => (
                            <div key={s.num} className={`flex items-start gap-5 transition-all duration-500 ${step === s.num ? 'opacity-100 scale-100' : 'opacity-60 scale-95'}`}>
                                <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg border-2 transition-all duration-500 ${
                                    step > s.num ? 'bg-white text-primary border-white shadow-lg shadow-black/10' : 
                                    step === s.num ? 'bg-transparent text-white border-white' : 
                                    'bg-transparent text-white/40 border-white/40'
                                }`}>
                                    {step > s.num ? (
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    ) : s.icon}
                                </div>
                                <div className="mt-1">
                                    <h3 className="text-white font-bold text-lg tracking-wide">{s.title}</h3>
                                    <p className="text-white/80 text-sm mt-0.5">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 p-12">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                        </div>
                        <span className="text-sm font-medium text-white/90">Secure & Encrypted Process</span>
                    </div>
                </div>
            </div>

            {/* Right side: Form */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 h-screen overflow-y-auto relative bg-white">
                <div className="w-full max-w-2xl">
                    <div className="mb-10 lg:hidden flex items-center gap-3">
                        <div className="bg-primary/10 p-3 rounded-full text-primary">
                            {steps[step-1].icon}
                        </div>
                        <div>
                            <span className="text-sm font-bold text-primary uppercase tracking-widest mb-1 block">Step {step} of 3</span>
                            <h2 className="text-3xl font-extrabold text-gray-900">{steps[step - 1].title}</h2>
                        </div>
                    </div>

                    <div className="bg-white lg:bg-transparent lg:shadow-none shadow-xl rounded-3xl p-8 lg:p-0 transition-all duration-500 ease-out transform translate-y-0 opacity-100">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div className="hidden lg:flex items-center gap-4 mb-8 border-b pb-4 border-gray-100">
                                    <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-gray-900">Personal Details</h2>
                                </div>
                                
                                <div className="space-y-5">
                                    <div className="relative group">
                                        <div className="absolute left-5 top-5 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                        </div>
                                        <input type="text" id="fullName" value={personalInfo.fullName} onChange={e => setPersonalInfo({...personalInfo, fullName: e.target.value})} className="peer w-full pl-12 pr-5 py-4 pt-6 rounded-2xl border-2 border-gray-100 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-transparent font-medium text-gray-900 shadow-sm" placeholder="Full Name" required />
                                        <label htmlFor="fullName" className="absolute left-12 top-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-medium peer-focus:top-2.5 peer-focus:text-xs peer-focus:font-bold peer-focus:tracking-wider peer-focus:text-primary pointer-events-none">Full Legal Name</label>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="relative group">
                                            <div className="absolute left-5 top-5 text-gray-400 group-focus-within:text-primary transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                            </div>
                                            <input type="tel" id="phone" value={personalInfo.phone} onChange={e => setPersonalInfo({...personalInfo, phone: e.target.value})} className="peer w-full pl-12 pr-5 py-4 pt-6 rounded-2xl border-2 border-gray-100 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-transparent font-medium text-gray-900 shadow-sm" placeholder="Phone Number" required />
                                            <label htmlFor="phone" className="absolute left-12 top-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-medium peer-focus:top-2.5 peer-focus:text-xs peer-focus:font-bold peer-focus:tracking-wider peer-focus:text-primary pointer-events-none">Phone Number</label>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-5 text-gray-400 group-focus-within:text-primary transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                            </div>
                                            <input type="date" id="dob" value={personalInfo.dateOfBirth} onChange={e => setPersonalInfo({...personalInfo, dateOfBirth: e.target.value})} className="peer w-full pl-12 pr-5 py-4 pt-6 rounded-2xl border-2 border-gray-100 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-gray-900 shadow-sm" required />
                                            <label htmlFor="dob" className="absolute left-12 top-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider transition-all peer-focus:text-primary pointer-events-none">Date of Birth</label>
                                        </div>
                                    </div>

                                    <div className="relative group">
                                        <div className="absolute left-5 top-5 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                                        </div>
                                        <textarea id="address" value={personalInfo.currentAddress} onChange={e => setPersonalInfo({...personalInfo, currentAddress: e.target.value})} className="peer w-full pl-12 pr-5 py-4 pt-8 rounded-2xl border-2 border-gray-100 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-transparent font-medium text-gray-900 shadow-sm resize-none" rows={3} placeholder="Current Address" required></textarea>
                                        <label htmlFor="address" className="absolute left-12 top-3 text-xs font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-5 peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-medium peer-focus:top-3 peer-focus:text-xs peer-focus:font-bold peer-focus:tracking-wider peer-focus:text-primary pointer-events-none">Current Residential Address</label>
                                    </div>
                                </div>
                                
                                <div className="pt-6">
                                    <button onClick={() => setStep(2)} className="w-full bg-primary text-white hover:bg-primary/90 py-4 px-8 rounded-2xl font-bold text-lg tracking-wide transition-all active:scale-[0.98] shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group">
                                        Continue to Employment
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="hidden lg:flex items-center gap-4 mb-8 border-b pb-4 border-gray-100">
                                    <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-gray-900">Employment History</h2>
                                </div>
                                
                                <div className="space-y-5">
                                    <div className="relative group">
                                        <div className="absolute left-5 top-5 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                        </div>
                                        <input type="text" id="employer" value={employmentInfo.employerName} onChange={e => setEmploymentInfo({...employmentInfo, employerName: e.target.value})} className="peer w-full pl-12 pr-5 py-4 pt-6 rounded-2xl border-2 border-gray-100 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-transparent font-medium text-gray-900 shadow-sm" placeholder="Employer Name" required />
                                        <label htmlFor="employer" className="absolute left-12 top-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-medium peer-focus:top-2.5 peer-focus:text-xs peer-focus:font-bold peer-focus:tracking-wider peer-focus:text-primary pointer-events-none">Current Employer Name</label>
                                    </div>
                                    
                                    <div className="relative group">
                                        <div className="absolute left-5 top-5 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
                                        </div>
                                        <input type="text" id="jobTitle" value={employmentInfo.jobTitle} onChange={e => setEmploymentInfo({...employmentInfo, jobTitle: e.target.value})} className="peer w-full pl-12 pr-5 py-4 pt-6 rounded-2xl border-2 border-gray-100 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-transparent font-medium text-gray-900 shadow-sm" placeholder="Job Title" required />
                                        <label htmlFor="jobTitle" className="absolute left-12 top-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-medium peer-focus:top-2.5 peer-focus:text-xs peer-focus:font-bold peer-focus:tracking-wider peer-focus:text-primary pointer-events-none">Job Title / Position</label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="relative group">
                                            <div className="absolute left-5 top-5 text-gray-400 group-focus-within:text-primary transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            </div>
                                            <input type="number" id="income" value={employmentInfo.monthlyIncome || ''} onChange={e => setEmploymentInfo({...employmentInfo, monthlyIncome: Number(e.target.value)})} className="peer w-full pl-12 pr-5 py-4 pt-6 rounded-2xl border-2 border-gray-100 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-transparent font-medium text-gray-900 shadow-sm" placeholder="Income" required />
                                            <label htmlFor="income" className="absolute left-12 top-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-medium peer-focus:top-2.5 peer-focus:text-xs peer-focus:font-bold peer-focus:tracking-wider peer-focus:text-primary pointer-events-none">Monthly Net Income</label>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-5 text-gray-400 group-focus-within:text-primary transition-colors">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            </div>
                                            <input type="text" id="length" value={employmentInfo.employmentLength} onChange={e => setEmploymentInfo({...employmentInfo, employmentLength: e.target.value})} className="peer w-full pl-12 pr-5 py-4 pt-6 rounded-2xl border-2 border-gray-100 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-transparent font-medium text-gray-900 shadow-sm" placeholder="Length" required />
                                            <label htmlFor="length" className="absolute left-12 top-2.5 text-xs font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-medium peer-focus:top-2.5 peer-focus:text-xs peer-focus:font-bold peer-focus:tracking-wider peer-focus:text-primary pointer-events-none">Duration (e.g. 2 yrs)</label>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-4 pt-6">
                                    <button onClick={() => setStep(1)} className="w-1/3 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-primary py-4 px-6 rounded-2xl font-bold tracking-wide transition-all active:scale-[0.98]">
                                        Back
                                    </button>
                                    <button onClick={() => setStep(3)} className="w-2/3 bg-primary text-white hover:bg-primary/90 py-4 px-6 rounded-2xl font-bold tracking-wide transition-all active:scale-[0.98] shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group">
                                        Continue to References
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-700">
                                <div className="hidden lg:flex items-center gap-4 mb-8 border-b pb-4 border-gray-100">
                                    <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                    </div>
                                    <h2 className="text-3xl font-extrabold text-gray-900">Personal References</h2>
                                </div>
                                
                                <p className="text-gray-500 font-medium mb-4">Please provide at least one trusted contact. We may contact them to verify your application.</p>

                                <div className="space-y-5">
                                    {references.map((ref, i) => (
                                        <div key={i} className="p-6 border-2 border-gray-100 rounded-2xl space-y-4 bg-gray-50/30 group hover:border-gray-200 transition-colors relative">
                                            {references.length > 1 && (
                                                <button onClick={() => setReferences(references.filter((_, idx) => idx !== i))} className="absolute right-4 top-4 text-gray-400 hover:text-red-500 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                </button>
                                            )}
                                            <div className="relative group">
                                                <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                                </div>
                                                <input type="text" id={`ref-name-${i}`} value={ref.name} onChange={e => handleRefChange(i, 'name', e.target.value)} className="peer w-full pl-11 pr-4 py-3 pt-5 rounded-xl border-2 border-gray-100 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-transparent font-medium shadow-sm" placeholder="Name" required />
                                                <label htmlFor={`ref-name-${i}`} className="absolute left-11 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-focus:tracking-wider peer-focus:text-primary pointer-events-none">Reference Name</label>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                                    </div>
                                                    <input type="text" id={`ref-rel-${i}`} value={ref.relationship} onChange={e => handleRefChange(i, 'relationship', e.target.value)} className="peer w-full pl-11 pr-4 py-3 pt-5 rounded-xl border-2 border-gray-100 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-transparent font-medium shadow-sm" placeholder="Relation" required />
                                                    <label htmlFor={`ref-rel-${i}`} className="absolute left-11 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-focus:tracking-wider peer-focus:text-primary pointer-events-none">Relationship</label>
                                                </div>
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-4 text-gray-400 group-focus-within:text-primary transition-colors">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                                    </div>
                                                    <input type="tel" id={`ref-phone-${i}`} value={ref.phone} onChange={e => handleRefChange(i, 'phone', e.target.value)} className="peer w-full pl-11 pr-4 py-3 pt-5 rounded-xl border-2 border-gray-100 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder-transparent font-medium shadow-sm" placeholder="Phone" required />
                                                    <label htmlFor={`ref-phone-${i}`} className="absolute left-11 top-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:tracking-normal peer-placeholder-shown:font-medium peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-focus:tracking-wider peer-focus:text-primary pointer-events-none">Phone Number</label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <button onClick={addReference} className="w-full py-4 border-2 border-dashed border-primary/30 rounded-2xl text-primary font-bold hover:bg-primary/5 hover:border-primary/50 transition flex items-center justify-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                    Add Another Reference
                                </button>
                                
                                <div className="flex gap-4 pt-6 border-t border-gray-100 mt-8">
                                    <button onClick={() => setStep(2)} className="w-1/3 bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 hover:text-primary py-4 px-6 rounded-2xl font-bold tracking-wide transition-all active:scale-[0.98]">
                                        Back
                                    </button>
                                    <button onClick={submitApplication} disabled={loading} className="w-2/3 bg-primary text-white hover:bg-primary/90 py-4 px-6 rounded-2xl font-bold tracking-wide transition-all active:scale-[0.98] shadow-xl shadow-primary/20 flex items-center justify-center gap-3">
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                Submit Application
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
