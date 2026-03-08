'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface WishlistContextType {
    wishlistIds: string[];
    addToWishlist: (propertyId: string) => Promise<void>;
    removeFromWishlist: (propertyId: string) => Promise<void>;
    isInWishlist: (propertyId: string) => boolean;
    refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
    const [wishlistIds, setWishlistIds] = useState<string[]>([]);

    const fetchWishlist = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setWishlistIds([]);
            return;
        }

        try {
            const res = await axios.get('http://127.0.0.1:8080/api/wishlist', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Based on WishlistRepository, it returns a wishlist object with items
            const items = res.data.data.items || [];
            const ids = items.map((item: any) =>
                typeof item.property === 'string' ? item.property : item.property._id
            );
            setWishlistIds(ids);
        } catch (err) {
            console.error('Failed to fetch wishlist:', err);
        }
    }, []);

    useEffect(() => {
        fetchWishlist();

        // Listen for storage changes (login/logout)
        const handleStorageChange = () => {
            fetchWishlist();
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [fetchWishlist]);

    const addToWishlist = async (propertyId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await axios.post(`http://127.0.0.1:8080/api/wishlist/add/${propertyId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWishlistIds(prev => [...prev, propertyId]);
        } catch (err) {
            console.error('Failed to add to wishlist:', err);
            throw err;
        }
    };

    const removeFromWishlist = async (propertyId: string) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await axios.delete(`http://127.0.0.1:8080/api/wishlist/remove/${propertyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWishlistIds(prev => prev.filter(id => id !== propertyId));
        } catch (err) {
            console.error('Failed to remove from wishlist:', err);
            throw err;
        }
    };

    const isInWishlist = (propertyId: string) => wishlistIds.includes(propertyId);

    return (
        <WishlistContext.Provider value={{
            wishlistIds,
            addToWishlist,
            removeFromWishlist,
            isInWishlist,
            refreshWishlist: fetchWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
