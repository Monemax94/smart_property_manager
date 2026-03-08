'use client';
import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { clearSession, isTokenExpired } from '@/utils/auth';

interface Property {
    _id: string;
    title: string;
    listingType: 'for_rent' | 'for_sale';
    propertyType: string;
    propertySubType: string;
    pricing: {
        rentPrice: number;
        salePrice: number;
        currency: string;
    };
    status: string;
    images: Array<{ url: string }>;
    createdAt: string;
}

interface DashboardPropertiesProps {
    onNotify?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export default function DashboardProperties({ onNotify }: DashboardPropertiesProps) {
    const router = useRouter();
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [listingTypeFilter, setListingTypeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 5;

    const fetchProperties = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token || isTokenExpired(token)) {
            clearSession();
            router.push('/login');
            return;
        }
        try {
            const res = await axios.get('http://127.0.0.1:8080/api/properties/my-properties', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page,
                    limit,
                    search: searchTerm || undefined,
                    listingType: listingTypeFilter || undefined,
                    status: statusFilter || undefined
                }
            });

            // Backend returns: res.data.data.data for the array, res.data.data.meta for pagination
            const dataWrap = res.data?.data || {};
            setProperties(dataWrap.data || []);
            setTotal(dataWrap.meta?.total || 0);
        } catch (err: any) {
            console.error('Failed to fetch user properties', err);
            if (err.response?.status === 401) {
                clearSession();
                router.push('/login');
                return;
            }
            if (onNotify) {
                onNotify('error', err.response?.data?.message || 'Failed to fetch your properties');
            }
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm, listingTypeFilter, statusFilter, router, onNotify]);

    useEffect(() => {
        const handler = setTimeout(() => {
            fetchProperties();
        }, 300); // Small debounce for search
        return () => clearTimeout(handler);
    }, [fetchProperties]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setListingTypeFilter(e.target.value);
        setPage(1);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setStatusFilter(e.target.value);
        setPage(1);
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="bg-card rounded-xl border border-card-border shadow overflow-hidden mt-8">
            <div className="px-6 py-5 border-b border-card-border flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <h3 className="text-lg leading-6 font-bold text-foreground tracking-tight whitespace-nowrap">My Properties</h3>

                <div className="flex flex-col sm:flex-row gap-3 w-full xl:max-w-3xl">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search by title, type..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full px-4 py-2 text-sm border border-card-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-background text-foreground transition-all pl-10 h-10"
                        />
                        <svg className="w-4 h-4 text-muted-text absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={listingTypeFilter}
                            onChange={handleFilterChange}
                            className="px-3 py-2 text-xs font-bold border border-card-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-background text-foreground h-10 cursor-pointer min-w-[120px]"
                        >
                            <option value="">All Listings</option>
                            <option value="for_rent">For Rent</option>
                            <option value="for_sale">For Sale</option>
                        </select>

                        <select
                            value={statusFilter}
                            onChange={handleStatusChange}
                            className="px-3 py-2 text-xs font-bold border border-card-border rounded-lg focus:ring-2 focus:ring-primary outline-none bg-background text-foreground h-10 cursor-pointer min-w-[120px]"
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="draft">Draft</option>
                            <option value="sold">Sold</option>
                            <option value="rented">Rented</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-card-border">
                    <thead className="bg-gray-50/50 dark:bg-white/5">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-text uppercase tracking-widest">Property</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-text uppercase tracking-widest">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-text uppercase tracking-widest">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-muted-text uppercase tracking-widest">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-muted-text uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-card-border">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4"><div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-15 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-10 bg-gray-200 dark:bg-gray-700 ml-auto rounded"></div></td>
                                </tr>
                            ))
                        ) : properties.length > 0 ? (
                            properties.map((property) => (
                                <tr key={property._id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 relative flex-shrink-0">
                                                <Image
                                                    className="rounded-lg object-cover"
                                                    src={property.images?.[0]?.url || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=100&h=100'}
                                                    alt=""
                                                    layout="fill"
                                                />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-bold text-foreground truncate max-w-[200px]">{property.title}</div>
                                                <div className="text-[10px] text-muted-text uppercase font-bold tracking-tighter">Listed {new Date(property.createdAt).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 text-[10px] uppercase font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
                                            {property.propertySubType.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-foreground">
                                        {property.pricing.currency === 'USD' ? '$' : '₦'}
                                        {property.listingType === 'for_rent'
                                            ? `${property.pricing.rentPrice.toLocaleString()}/mo`
                                            : property.pricing.salePrice.toLocaleString()
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-full ${property.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {property.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                        <button
                                            onClick={() => router.push(`/properties/edit/${property._id}`)}
                                            className="text-primary hover:text-primary-hover font-bold transition-colors group-hover:underline"
                                        >
                                            Edit Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-text font-medium bg-gray-50/20">
                                    You haven't listed any properties yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-card-border flex items-center justify-between">
                    <p className="text-xs text-muted-text font-bold">Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} properties</p>
                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 text-xs font-bold border border-card-border rounded hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 text-xs font-bold border border-card-border rounded hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
