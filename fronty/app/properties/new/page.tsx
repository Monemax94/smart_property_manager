'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { isTokenExpired, clearSession } from '@/utils/auth';

const PROPERTY_TYPES = {
    residential: ['apartment', 'house', 'villa', 'townhouse', 'penthouse', 'studio', 'duplex', 'condo'],
    commercial: ['office', 'retail', 'restaurant', 'hotel', 'shopping_center', 'warehouse'],
    industrial: ['factory', 'storage', 'distribution_center'],
    land: ['residential_plot', 'commercial_plot', 'agricultural', 'industrial_plot'],
    mixed_use: ['mixed_use']
};

interface Address {
    _id: string;
    street: string;
    city: string;
    state: string;
}

export default function NewPropertyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (isTokenExpired(token)) {
            clearSession();
            router.push('/login');
        } else {
            fetchUserAddresses(token!);
        }
    }, [router]);

    const fetchUserAddresses = async (token: string) => {
        try {
            const res = await axios.get('http://127.0.0.1:8080/api/addresses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Handle ApiResponse wrap robustly
            const responseData = res.data?.data || res.data;
            const addressData = Array.isArray(responseData) ? responseData : (responseData?.data || []);
            
            console.log('Fetched properties/new addresses:', addressData);
            
            setAddresses(addressData);
            if (addressData.length > 0) {
                setFormData(prev => ({ ...prev, addressId: addressData[0]._id }));
            }
        } catch (err) {
            console.error('Failed to fetch addresses');
        }
    };

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        propertyType: 'residential',
        propertySubType: 'apartment',
        listingType: 'for_rent',
        addressId: '',
    });

    const [pricing, setPricing] = useState({
        rentPrice: 0,
        salePrice: 0,
        currency: 'NGN'
    });

    const [features, setFeatures] = useState({
        bedrooms: 1,
        bathrooms: 1,
        builtUpArea: 100,
        totalFloors: 1,
        floorNumber: 1
    });

    const [images, setImages] = useState<FileList | null>(null);
    const [videos, setVideos] = useState<FileList | null>(null);
    const [videoPreviewUrls, setVideoPreviewUrls] = useState<string[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'propertyType') {
            setFormData({
                ...formData,
                [name]: value,
                propertySubType: PROPERTY_TYPES[value as keyof typeof PROPERTY_TYPES][0]
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setPricing({ ...pricing, [e.target.name]: e.target.name === 'currency' ? e.target.value : Number(e.target.value) });
    };

    const handleFeaturesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFeatures({ ...features, [e.target.name]: Number(e.target.value) });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImages(e.target.files);
    };

    const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            setVideos(files);
            // Generate local preview URLs for each video
            const urls = Array.from(files).map(f => URL.createObjectURL(f));
            setVideoPreviewUrls(urls);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.addressId) {
            setError('Please select or add an address in your profile first');
            return;
        }

        setLoading(true);
        setError('');

        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            setError('Please login to create a property');
            setLoading(false);
            return;
        }

        const user = JSON.parse(userStr);

        try {
            const data = new FormData();

            // Basic Info
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('propertyType', formData.propertyType);
            data.append('propertySubType', formData.propertySubType);
            data.append('listingType', formData.listingType);
            data.append('addressId', formData.addressId);
            data.append('ownerId', user._id);

            // Pricing
            const cleanPricing = formData.listingType === 'for_rent'
                ? { rentPrice: pricing.rentPrice, currency: pricing.currency }
                : { salePrice: pricing.salePrice, currency: pricing.currency };
            data.append('pricing', JSON.stringify(cleanPricing));

            // Features
            data.append('features', JSON.stringify(features));
            data.append('status', 'active');

            // Images
            if (images) {
                Array.from(images).forEach((file) => {
                    data.append('images', file);
                });
            }

            // Videos (short clips)
            if (videos) {
                Array.from(videos).forEach((file) => {
                    data.append('videos', file);
                });
            }

            const res = await axios.post('http://127.0.0.1:8080/api/properties', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            setSuccess(true);
            setTimeout(() => {
                router.push(`/properties/${res.data.data._id}`);
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create property');
            console.error('Property Creation Error:', err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-xl text-center animate-bounce">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Successfully Listed!</h2>
                    <p className="text-gray-600 mt-2">Your property is now live.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-extrabold text-gray-900">List Your Property</h1>
                <p className="text-gray-600 mt-2">Follow the steps below to feature your property on SmartHome.</p>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-8 shadow-sm animate-fadeIn" role="alert">
                    <p className="font-bold border-b border-red-200 pb-1 mb-2 uppercase text-xs tracking-widest">Listing Error</p>
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100">
                {/* 1. Basic Information */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <span className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold shadow-lg">1</span>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Essential Details</h2>
                    </div>

                    <div className="space-y-5">
                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest group-focus-within:text-primary transition-colors">Property Title</label>
                            <input required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Elegant 4 Bedroom Duplex with Ocean View" className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all placeholder-gray-300 bg-gray-50/30 font-medium" />
                        </div>

                        <div className="group">
                            <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest group-focus-within:text-primary transition-colors">Comprehensive Description</label>
                            <textarea required name="description" value={formData.description} onChange={handleChange} rows={5} placeholder="Walk us through the property... What makes it special? (Schools nearby, security, finishing, etc.)" className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all resize-none placeholder-gray-300 bg-gray-50/30 leading-relaxed font-medium"></textarea>
                        </div>
                    </div>
                </div>

                {/* 2. Categorization & Location */}
                <div className="pt-8 space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <span className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold shadow-lg">2</span>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Category & Location</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Primary Type</label>
                                    <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/50 font-medium appearance-none cursor-pointer">
                                        <option value="residential">Residential</option>
                                        <option value="commercial">Commercial</option>
                                        <option value="industrial">Industrial</option>
                                        <option value="land">Land</option>
                                        <option value="mixed_use">Mixed Use</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Sub-Type</label>
                                    <select name="propertySubType" value={formData.propertySubType} onChange={handleChange} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/50 font-medium appearance-none cursor-pointer">
                                        {PROPERTY_TYPES[formData.propertyType as keyof typeof PROPERTY_TYPES].map(type => (
                                            <option key={type} value={type}>{type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Listing Intent</label>
                                <div className="flex gap-4">
                                    {['for_rent', 'for_sale'].map((type) => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, listingType: type })}
                                            className={`flex-1 py-3 px-4 rounded-xl font-bold border-2 transition-all ${formData.listingType === type ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-gray-400 border-gray-100 hover:border-primary/30'}`}
                                        >
                                            {type === 'for_rent' ? 'For Rent' : 'For Sale'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Select Registered Address</label>
                            {addresses.length > 0 ? (
                                <select
                                    name="addressId"
                                    value={formData.addressId}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/50 font-medium h-[116px]"
                                    multiple={false}
                                >
                                    <option value="" disabled>Select a location...</option>
                                    {addresses.map(addr => (
                                        <option key={addr._id} value={addr._id}>
                                            {addr.street}, {addr.city} ({addr.state})
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl h-[116px] flex flex-col justify-center items-center text-center">
                                    <p className="text-yellow-700 text-xs font-bold mb-2">No registered addresses found</p>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/profile?tab=addresses')}
                                        className="text-primary text-xs underline font-bold"
                                    >
                                        + Add Address in Profile First
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Financials & Features */}
                <div className="pt-8 space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <span className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold shadow-lg">3</span>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Economics & Specs</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-50">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-primary mb-2 uppercase tracking-widest">Currency</label>
                                    <select name="currency" value={pricing.currency} onChange={handlePricingChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-white font-bold">
                                        <option value="NGN">NGN (₦)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-primary mb-2 uppercase tracking-widest">
                                        {formData.listingType === 'for_rent' ? 'Monthly Rent' : 'Selling Price'}
                                    </label>
                                    <input required type="number" name={formData.listingType === 'for_rent' ? 'rentPrice' : 'salePrice'} value={formData.listingType === 'for_rent' ? pricing.rentPrice : pricing.salePrice} onChange={handlePricingChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-bold text-lg" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Built-up Area (Sq Ft)</label>
                                <input required type="number" name="builtUpArea" value={features.builtUpArea} onChange={handleFeaturesChange} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 content-center">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Bedrooms</label>
                                <input required type="number" name="bedrooms" value={features.bedrooms} onChange={handleFeaturesChange} min="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Bathrooms</label>
                                <input required type="number" name="bathrooms" value={features.bathrooms} onChange={handleFeaturesChange} min="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Total Floors</label>
                                <input type="number" name="totalFloors" value={features.totalFloors} onChange={handleFeaturesChange} min="1" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Level / Floor No.</label>
                                <input type="number" name="floorNumber" value={features.floorNumber} onChange={handleFeaturesChange} min="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none font-medium" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Visual Media — Images */}
                <div className="pt-8 space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <span className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold shadow-lg">4</span>
                        <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Property Showcase</h2>
                    </div>

                    {/* Image upload */}
                    <div className="group relative border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer bg-gray-50/50">
                        <input required type="file" multiple accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            </div>
                            <p className="text-xl font-bold text-gray-700">{images ? `${images.length} Images Selected` : 'Drag & drop property images'}</p>
                            <p className="text-sm text-gray-400 mt-2 font-medium">Add at least 5 crystal-clear photos of interior & exterior.</p>
                        </div>
                    </div>

                    {/* Image previews */}
                    {images && images.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            {Array.from(images).map((img, i) => (
                                <div key={i} className="relative h-24 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={URL.createObjectURL(img)} alt={`preview-${i}`} className="object-cover w-full h-full" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 5. Short-Clip Videos */}
                <div className="pt-8 space-y-6">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                        <span className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-bold shadow-lg">5</span>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Property Walk-Through Videos</h2>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">Upload up to 5 short clip videos (max 60 seconds each). Optional but highly recommended.</p>
                        </div>
                    </div>

                    <div className="group relative border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer bg-gray-50/50">
                        <input type="file" multiple accept="video/*" onChange={handleVideoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="flex flex-col items-center">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-lg font-bold text-gray-700">
                                {videos ? `${videos.length} Video Clip${videos.length > 1 ? 's' : ''} Selected` : 'Click to upload short-clip videos'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 font-medium">MP4, MOV, WebM · Max 5 clips · Up to 100 MB each</p>
                        </div>
                    </div>

                    {/* Video previews */}
                    {videoPreviewUrls.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {videoPreviewUrls.map((url, i) => (
                                <div key={i} className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-black">
                                    <video
                                        src={url}
                                        controls
                                        className="w-full max-h-48 object-contain"
                                        preload="metadata"
                                    />
                                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                                        Clip {i + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="pt-10">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-white font-extrabold py-5 px-6 rounded-2xl shadow-2xl shadow-primary/30 hover:bg-primary-hover hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 text-xl tracking-tight"
                    >
                        {loading ? 'Submitting to Marketplace...' : 'List Property Now'}
                    </button>
                    <p className="text-center text-sm text-gray-400 mt-6 font-medium">By listing, you verify that you are the legal owner or authorized agent of this property.</p>
                </div>
            </form>
        </div>
    );
}
