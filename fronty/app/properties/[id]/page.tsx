'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import dynamic from 'next/dynamic';
const PropertyMap = dynamic(() => import('@/components/PropertyMap'), { ssr: false });

interface PropertyDetails {
    _id: string;
    title: string;
    description: string;
    propertyType: string;
    listingType: string;
    images: Array<{ url: string }>;
    videos?: Array<{ url: string }>;
    pricing: {
        salePrice?: number;
        rentPrice?: number;
        leasePrice?: number;
        currency: string;
    };
    features: {
        bedrooms?: number;
        bathrooms?: number;
        builtUpArea?: number;
    };
    addressId?: {
        street: string;
        city: string;
        state: string;
        country: string;
        latitude?: number;
        longitude?: number;
        neighborhood?: string;
        landmark?: string;
    };
    nearbyFacilities?: {
        schools?: Array<{ name: string; distance: number }>;
        hospitals?: Array<{ name: string; distance: number }>;
        shoppingCenters?: Array<{ name: string; distance: number }>;
        publicTransport?: Array<{ name: string; distance: number }>;
    };
    amenities?: string[];
}

export default function PropertyDetailsPage() {
    const { id } = useParams();
    const [property, setProperty] = useState<PropertyDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (!id) return;
        const fetchProperty = async () => {
            try {
                const res = await axios.get(`http://127.0.0.1:8080/api/properties/${id}`);
                // In PropertyController, res.data.data is the actual property
                setProperty(res.data.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load property');
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    const [paying, setPaying] = useState(false);

    const handlePayment = async () => {
        if (!property) return;
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to pay rent');
            return;
        }

        setPaying(true);
        try {
            const res = await axios.post('http://127.0.0.1:8080/api/payments/initialize', {
                propertyId: property._id,
                callback_url: window.location.origin + '/payment/verify',
                paymentGateWay: 'paystack'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(res.data);
            if (res.data.success && res.data?.data?.data?.data?.authorization_url) {
                window.location.href = res.data?.data?.data?.data?.authorization_url;
            } else {
                throw new Error('Failed to get authorization URL');
            }
        } catch (err: any) {
            console.error('Payment initialization failed', err);
            alert(err.response?.data?.message || 'Failed to initialize payment');
        } finally {
            setPaying(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium animate-pulse">Loading property details...</p>
            </div>
        </div>
    );

    if (error || !property) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Notice</h2>
                <p className="text-gray-600 mb-6">{error || 'Property not found'}</p>
                <button onClick={() => window.history.back()} className="px-6 py-2 bg-primary text-white rounded-xl font-bold hover:shadow-lg transition-all">Go Back</button>
            </div>
        </div>
    );

    const price = property.pricing.rentPrice || property.pricing.salePrice || 0;
    const isRent = property.listingType === 'for_rent' || !!property.pricing.rentPrice;
    const stats = [
        { label: 'Bedrooms', value: property.features?.bedrooms || '-' },
        { label: 'Bathrooms', value: property.features?.bathrooms || '-' },
        { label: 'Area', value: property.features?.builtUpArea ? `${property.features.builtUpArea} sqft` : '-' },
        { label: 'Type', value: property.propertyType },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 pt-8 mt-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {property.listingType.replace('_', ' ')}
                                </span>
                                {property.addressId?.neighborhood && (
                                    <span className="text-gray-400 text-xs font-medium flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
                                        {property.addressId.neighborhood}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">{property.title}</h1>
                            <p className="text-gray-500 mt-1 font-medium">
                                {property.addressId?.street}, {property.addressId?.city}, {property.addressId?.state}
                            </p>
                        </div>
                        <div className="bg-white px-8 py-4 rounded-2xl shadow-sm border border-gray-100 text-right">
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Pricing Guide</p>
                            <div className="text-2xl md:text-3xl font-black text-primary">
                                {property.pricing.currency} {price.toLocaleString()}
                                {isRent && <span className="text-sm font-bold text-gray-400"> / mo</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Images & Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero Image Carousel */}
                        <div className="relative h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl group">
                            {property.images && property.images.length > 0 ? (
                                <>
                                    <Image
                                        src={property.images[currentImageIndex]?.url}
                                        alt={property.title}
                                        layout="fill"
                                        objectFit="cover"
                                        className="transition-all duration-700 ease-in-out"
                                        key={currentImageIndex}
                                    />
                                    
                                    {/* Navigation Buttons */}
                                    {property.images.length > 1 && (
                                        <>
                                            <button 
                                                onClick={() => setCurrentImageIndex((prev) => (prev - 1 + property.images.length) % property.images.length)}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 border border-white/30"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                            </button>
                                            <button 
                                                onClick={() => setCurrentImageIndex((prev) => (prev + 1) % property.images.length)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-3 rounded-full transition-all opacity-0 group-hover:opacity-100 border border-white/30"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                            </button>
                                            
                                            {/* Indicators */}
                                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                                                {property.images.map((_, idx) => (
                                                    <button 
                                                        key={idx}
                                                        onClick={() => setCurrentImageIndex(idx)}
                                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'w-8 bg-primary' : 'w-2 bg-white/50'}`}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : (
                                <Image
                                    src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80"
                                    alt={property.title}
                                    layout="fill"
                                    objectFit="cover"
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stats.map((stat, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</span>
                                    <span className="text-lg font-bold text-gray-900">{stat.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Description */}
                        <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                Property Overview
                            </h3>
                            <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line font-medium">
                                {property.description}
                            </p>
                        </div>

                        {/* Videos (if any) */}
                        {property.videos && property.videos.length > 0 && (
                            <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                    Property Walk-Through
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {property.videos.map((vid, idx) => (
                                        <div key={idx} className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-md">
                                            <video
                                                controls
                                                src={vid.url}
                                                className="w-full h-full object-contain"
                                                preload="metadata"
                                                controlsList="nodownload"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Nearby Facilities */}
                        {property.nearbyFacilities && Object.values(property.nearbyFacilities).some(arr => arr && arr.length > 0) && (
                            <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-gray-100">
                                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                    Nearby Popular Facilities
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {property.nearbyFacilities.schools && property.nearbyFacilities.schools.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Educational Centers</h4>
                                            <div className="space-y-3">
                                                {property.nearbyFacilities.schools.slice(0, 3).map((s: { name: string; distance: number }, i: number) => (
                                                    <div key={i} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                                        <span className="text-sm font-bold text-gray-700">{s.name}</span>
                                                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-lg">{s.distance} km</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {property.nearbyFacilities.shoppingCenters && property.nearbyFacilities.shoppingCenters.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Lifestyles & Malls</h4>
                                            <div className="space-y-3">
                                                {property.nearbyFacilities.shoppingCenters.slice(0, 3).map((s: { name: string; distance: number }, i: number) => (
                                                    <div key={i} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                                                        <span className="text-sm font-bold text-gray-700">{s.name}</span>
                                                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-lg">{s.distance} km</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Address, Map & CTA */}
                    <div className="space-y-8">
                        {/* Map Card */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900">Map View</h3>
                                {property.addressId?.landmark && (
                                    <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md font-bold uppercase">
                                        Near {property.addressId.landmark}
                                    </span>
                                )}
                            </div>
                            <PropertyMap
                                latitude={property.addressId?.latitude || 0}
                                longitude={property.addressId?.longitude || 0}
                                title={property.title}
                                address={property.addressId?.street}
                            />
                            <div className="p-6 bg-gray-50/30">
                                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-widest">Full Location</div>
                                <p className="text-sm font-bold text-gray-800 leading-relaxed">
                                    {property.addressId?.street}<br />
                                    {property.addressId?.city}, {property.addressId?.state}<br />
                                    {property.addressId?.country}
                                </p>
                            </div>
                        </div>

                        {/* CTA Card */}
                        <div className="bg-primary p-6 md:p-8 rounded-3xl shadow-2xl shadow-primary/20 text-white sticky top-24">
                            <h3 className="text-xl md:text-2xl font-black mb-4 tracking-tight leading-tight">Interested in this property?</h3>
                            <p className="text-white/80 text-sm mb-8 leading-relaxed font-medium">
                                Start the process today. Our automated system will guide you through the next steps and connect you with the owner.
                            </p>
                            <div className="space-y-4">
                                {isRent && (
                                    <button
                                        onClick={handlePayment}
                                        disabled={paying}
                                        className="w-full bg-white text-primary font-black py-4 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10 uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                                    >
                                        {paying ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                Initializing...
                                            </>
                                        ) : 'Pay Rent Now'}
                                    </button>
                                )}
                                <button
                                    onClick={() => alert('Contacting agent...')}
                                    className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white font-black py-4 px-6 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                                >
                                    {isRent ? 'Apply for Rental' : 'Make an Purchase Offer'}
                                </button>
                            </div>
                            <div className="mt-8 pt-8 border-t border-white/20 grid grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-white/50 uppercase">Virtual Tour</span>
                                    <span className="text-sm font-bold">Request Access</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-white/50 uppercase">Response Time</span>
                                    <span className="text-sm font-bold">~24 Hours</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
