import Image from 'next/image';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';

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
}

export default function PropertyCard({ property }: { property: Property }) {
    const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
    const isFavorited = isInWishlist(property._id);
    const imageUrl = property.images && property.images.length > 0 ? property.images[0].url : 'https://via.placeholder.com/400';

    const getCurrencySymbol = (code: string) => {
        switch (code) {
            case 'NGN': return '₦';
            case 'GBP': return '£';
            case 'EUR': return '€';
            default: return '$';
        }
    };

    const currencySymbol = getCurrencySymbol(property.pricing?.currency || 'USD');
    const price = property.pricing?.rentPrice || property.pricing?.salePrice || 0;
    const isRent = property.listingType === 'for_rent' || !!property.pricing?.rentPrice;

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login to add to wishlist');
            return;
        }

        try {
            if (isFavorited) {
                await removeFromWishlist(property._id);
            } else {
                await addToWishlist(property._id);
            }
        } catch (err) {
            console.error('Wishlist action failed', err);
        }
    };

    return (
        <div className="rounded-lg overflow-hidden shadow-lg bg-white hover:shadow-xl transition-shadow flex flex-col relative group">
            <button
                onClick={toggleFavorite}
                className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-md transition-all ${isFavorited ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-white'}`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={isFavorited ? "currentColor" : "none"} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
            </button>
            <Link href={`/properties/${property._id}`} className="relative h-48 w-full block">
                <Image
                    src={imageUrl}
                    alt={property.title}
                    layout="fill"
                    objectFit="cover"
                />
            </Link>
            <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                    <h2 className="text-xl font-semibold mb-2 line-clamp-1">{property.title}</h2>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{property.description}</p>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-lg font-bold text-primary">{currencySymbol}{price.toLocaleString()}{isRent ? '/mo' : ''}</span>
                    <Link
                        href={`/properties/${property._id}`}
                        className="text-sm font-medium text-primary hover:text-primary-hover hover:underline transition-colors"
                    >
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
}

