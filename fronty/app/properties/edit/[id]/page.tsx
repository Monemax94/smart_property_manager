'use client';
import { useState, useEffect, use } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { isTokenExpired, clearSession } from '@/utils/auth';

const PROPERTY_TYPESCount = {
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

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [addresses, setAddresses] = useState<Address[]>([]);

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
        bedrooms: 0,
        bathrooms: 0,
        builtUpArea: 0,
        totalFloors: 1,
        floorNumber: 0
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (isTokenExpired(token)) {
            clearSession();
            router.push('/login');
        } else {
            fetchInitialData(token!);
        }
    }, [router, id]);

    const fetchInitialData = async (token: string) => {
        try {
            const [addressRes, propertyRes] = await Promise.all([
                axios.get('http://127.0.0.1:8080/api/addresses', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`http://127.0.0.1:8080/api/properties/${id}`)
            ]);

            const property = propertyRes.data.data;
            const addressData = addressRes.data.data.data || [];
            setAddresses(addressData);

            setFormData({
                title: property.title,
                description: property.description,
                propertyType: property.propertyType,
                propertySubType: property.propertySubType,
                listingType: property.listingType,
                addressId: property.address?._id || property.addressId || ''
            });

            setPricing({
                rentPrice: property.pricing?.rentPrice || 0,
                salePrice: property.pricing?.salePrice || 0,
                currency: property.pricing?.currency || 'NGN'
            });

            setFeatures({
                bedrooms: property.features?.bedrooms || 0,
                bathrooms: property.features?.bathrooms || 0,
                builtUpArea: property.features?.builtUpArea || 0,
                totalFloors: property.features?.totalFloors || 1,
                floorNumber: property.features?.floorNumber || 0
            });

        } catch (err: any) {
            setError('Failed to load property details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'propertyType') {
            setFormData({
                ...formData,
                [name]: value,
                propertySubType: PROPERTY_TYPESCount[value as keyof typeof PROPERTY_TYPESCount][0]
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        const token = localStorage.getItem('token');
        try {
            const updateData = {
                ...formData,
                pricing: formData.listingType === 'for_rent'
                    ? { rentPrice: pricing.rentPrice, currency: pricing.currency }
                    : { salePrice: pricing.salePrice, currency: pricing.currency },
                features
            };

            await axios.put(`http://127.0.0.1:8080/api/properties/${id}`, updateData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update property');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-background">Loading property details...</div>;

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="bg-card p-8 rounded-2xl shadow-2xl text-center border border-card-border animate-fadeIn">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Updated Successfully!</h2>
                    <p className="text-muted-text mt-2 font-medium">Your changes have been saved.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 bg-background transition-colors duration-300">
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold text-foreground tracking-tight">Edit Listing</h1>
                    <p className="text-muted-text mt-2 font-medium">Refine your property information for potential buyers.</p>
                </div>
                <button onClick={() => router.back()} className="text-muted-text hover:text-foreground font-bold flex items-center gap-1 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-8 shadow-sm">
                    <p className="font-bold uppercase text-xs tracking-widest mb-1">Update Error</p>
                    <p className="font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 bg-card p-6 md:p-10 rounded-2xl shadow-xl border border-card-border transition-all">
                {/* Basic Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-card-border pb-4">
                        <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">1</span>
                        <h2 className="text-xl font-bold text-foreground tracking-tight">Essential Info</h2>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-muted-text mb-2 uppercase tracking-widest">Property Title</label>
                            <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-3 border border-card-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background text-foreground font-medium" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-muted-text mb-2 uppercase tracking-widest">Description</label>
                            <textarea required name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full px-4 py-3 border border-card-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background text-foreground font-medium leading-relaxed"></textarea>
                        </div>
                    </div>
                </div>

                {/* Categorization */}
                <div className="pt-8 space-y-6">
                    <div className="flex items-center gap-3 border-b border-card-border pb-4">
                        <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">2</span>
                        <h2 className="text-xl font-bold text-foreground tracking-tight">Categorization</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-muted-text mb-2 uppercase tracking-widest">Listing Type</label>
                            <select name="listingType" value={formData.listingType} onChange={handleChange} className="w-full px-4 py-3 border border-card-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background text-foreground font-bold">
                                <option value="for_rent">For Rent</option>
                                <option value="for_sale">For Sale</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-muted-text mb-2 uppercase tracking-widest">Category</label>
                            <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full px-4 py-3 border border-card-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background text-foreground font-bold">
                                {Object.keys(PROPERTY_TYPESCount).map(type => (
                                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-muted-text mb-2 uppercase tracking-widest">Sub-Type</label>
                            <select name="propertySubType" value={formData.propertySubType} onChange={handleChange} className="w-full px-4 py-3 border border-card-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background text-foreground font-bold">
                                {PROPERTY_TYPESCount[formData.propertyType as keyof typeof PROPERTY_TYPESCount].map(type => (
                                    <option key={type} value={type}>{type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Pricing & Features */}
                <div className="pt-8 space-y-6">
                    <div className="flex items-center gap-3 border-b border-card-border pb-4">
                        <span className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">3</span>
                        <h2 className="text-xl font-bold text-foreground tracking-tight">Finances & Specs</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-muted-text mb-2 uppercase tracking-widest">Currency</label>
                                <select name="currency" value={pricing.currency} onChange={handlePricingChange} className="w-full px-4 py-3 border border-card-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background text-foreground font-bold">
                                    <option value="NGN">NGN (₦)</option>
                                    <option value="USD">USD ($)</option>
                                    <option value="GBP">GBP (£)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-muted-text mb-2 uppercase tracking-widest">Price</label>
                                <input required type="number" name={formData.listingType === 'for_rent' ? 'rentPrice' : 'salePrice'} value={formData.listingType === 'for_rent' ? pricing.rentPrice : pricing.salePrice} onChange={handlePricingChange} className="w-full px-4 py-3 border border-card-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background text-foreground font-bold" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-muted-text mb-2 uppercase tracking-widest">Beds</label>
                                <input type="number" name="bedrooms" value={features.bedrooms} onChange={handleFeaturesChange} className="w-full px-4 py-3 border border-card-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background text-foreground font-bold" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-muted-text mb-2 uppercase tracking-widest">Baths</label>
                                <input type="number" name="bathrooms" value={features.bathrooms} onChange={handleFeaturesChange} className="w-full px-4 py-3 border border-card-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background text-foreground font-bold" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-muted-text mb-2 uppercase tracking-widest">Area(sqft)</label>
                                <input type="number" name="builtUpArea" value={features.builtUpArea} onChange={handleFeaturesChange} className="w-full px-4 py-3 border border-card-border rounded-xl focus:ring-2 focus:ring-primary outline-none bg-background text-foreground font-bold" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-10">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-xl shadow-primary/20 hover:bg-primary-hover hover:-translate-y-1 transition-all disabled:opacity-50 text-lg"
                    >
                        {submitting ? 'Saving Changes...' : 'Save Property Details'}
                    </button>
                    <p className="text-center text-[10px] text-muted-text mt-4 font-bold uppercase tracking-tight">Images cannot be edited here. Delete and relist if photos need changing.</p>
                </div>
            </form>
        </div>
    );
}
