'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PropertyCard from '@/components/PropertyCard';

interface Property {
    _id: string;
    title: string;
    description: string;
    images: Array<{ url: string }>;
    pricing: {
        rentPrice?: number;
        salePrice?: number;
        currency?: string;
    };
    listingType?: string;
    propertyType?: string;
    isFeatured?: boolean;
    createdAt: string;
}

export default function PropertiesSearchPage() {
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [city, setCity] = useState('');
    const [amenities, setAmenities] = useState<string[]>([]);
    
    // UI state
    const [showFilters, setShowFilters] = useState(false);

    const availableAmenities = ['Pool', 'Gym', 'Security', 'WiFi', 'Parking', 'Furnished', 'AC'];

    const fetchProperties = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            // Build query params
            const params = new URLSearchParams();
            if (searchQuery) params.append('q', searchQuery);
            if (minPrice) params.append('minPrice', minPrice);
            if (maxPrice) params.append('maxPrice', maxPrice);
            if (city) params.append('city', city);
            if (amenities.length > 0) params.append('amenities', amenities.join(','));

            const res = await axios.get(`http://127.0.0.1:8080/api/properties/search?${params.toString()}`);
            setProperties(res.data?.data?.properties || res.data?.data || []);
        } catch (err: any) {
            console.error('Failed to fetch properties', err);
            setError('Failed to load properties. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    const toggleAmenity = (amenity: string) => {
        setAmenities(prev => 
            prev.includes(amenity) 
                ? prev.filter(a => a !== amenity)
                : [...prev, amenity]
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-24">
            <div className="mb-12 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter mb-4">
                        Property <span className="text-primary italic">Marketplace</span>
                    </h1>
                    <p className="text-gray-500 max-w-2xl font-medium text-lg mb-8">
                        Discover exclusive listings, verify property details, and find your next smart home with our advanced search tools.
                    </p>

                    {/* Search Bar */}
                    <form onSubmit={fetchProperties} className="relative z-20">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-grow">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search by keywords, title, or reference..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-transparent bg-gray-100 focus:bg-white focus:border-primary focus:ring-0 outline-none transition-all font-medium text-gray-900 placeholder-gray-400 shadow-sm"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFilters(!showFilters)}
                                className="px-6 py-4 rounded-xl bg-gray-200 text-gray-700 font-bold tracking-widest uppercase hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                                Filters
                            </button>
                            <button
                                type="submit"
                                className="px-10 py-4 rounded-xl bg-primary text-white font-black tracking-widest uppercase hover:bg-primary-hover shadow-lg shadow-primary/30 transition-all flex items-center justify-center"
                            >
                                Search
                            </button>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="mt-4 p-6 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-200/50 absolute w-full z-30 animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Location */}
                                    <div>
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Location</h4>
                                        <input
                                            type="text"
                                            placeholder="City (e.g., Lagos, Abuja)"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-0 outline-none font-medium"
                                        />
                                    </div>

                                    {/* Price Range */}
                                    <div>
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Price Range</h4>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                placeholder="Min Price"
                                                value={minPrice}
                                                onChange={(e) => setMinPrice(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-0 outline-none font-medium"
                                            />
                                            <span className="text-gray-400 font-bold">-</span>
                                            <input
                                                type="number"
                                                placeholder="Max Price"
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-0 outline-none font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Amenities */}
                                    <div>
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Amenities</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {availableAmenities.map(amenity => (
                                                <button
                                                    key={amenity}
                                                    type="button"
                                                    onClick={() => toggleAmenity(amenity)}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors border ${
                                                        amenities.includes(amenity)
                                                            ? 'bg-primary text-white border-primary shadow-md'
                                                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'
                                                    }`}
                                                >
                                                    {amenity}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setMinPrice('');
                                            setMaxPrice('');
                                            setCity('');
                                            setAmenities([]);
                                        }}
                                        className="text-xs font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest mr-4"
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            setShowFilters(false);
                                            fetchProperties(e as any);
                                        }}
                                        className="bg-gray-900 text-white px-6 py-2 rounded-lg font-bold text-sm tracking-wide shadow-md"
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {loading ? (
                    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white h-[400px] rounded-[2rem] animate-pulse border border-gray-100 shadow-sm" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="py-24 bg-red-50 rounded-[3rem] text-center border border-red-100">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Unable to load properties</h3>
                        <p className="text-gray-500 max-w-md mx-auto">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 flex justify-between items-center relative z-10">
                            <p className="text-gray-500 font-medium">Showing <span className="font-bold text-gray-900">{properties.length}</span> results</p>
                        </div>
                        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 relative z-10">
                            {properties.length > 0 ? (
                                properties.map((property) => (
                                    <PropertyCard key={property._id} property={property} />
                                ))
                            ) : (
                                <div className="col-span-full py-20 bg-white rounded-[2rem] text-center shadow-sm border border-gray-100">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 mt-4">No properties match your search</h3>
                                    <p className="text-gray-500">Try adjusting your filters or search terms to find what you're looking for.</p>
                                    <button 
                                        onClick={() => {
                                            setSearchQuery('');
                                            setMinPrice('');
                                            setMaxPrice('');
                                            setCity('');
                                            setAmenities([]);
                                            setTimeout(fetchProperties, 100);
                                        }}
                                        className="mt-6 px-6 py-2 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-hover"
                                    >
                                        Clear Search
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
