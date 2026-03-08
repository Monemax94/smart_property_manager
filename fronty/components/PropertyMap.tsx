'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamic imports for react-leaflet components to avoid SSR window error
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });

// For useMap, we can't easily dynamic import it since it's a hook.
// We'll wrap the logic that uses it in a client-only component.

interface PropertyMapProps {
    latitude: number;
    longitude: number;
    title: string;
    address?: string;
}

// Helper component to center map when coords change
// This is moved inside the main component to handle hooks correctly if needed,
// but actually hooks need to be in a component rendered inside MapContainer.
function ChangeView({ center }: { center: [number, number] }) {
    // We import useMap dynamically inside the helper or just hope it's only called on client
    const [map, setMap] = useState<any>(null);

    useEffect(() => {
        const loadMap = async () => {
            const { useMap } = await import('react-leaflet');
            // Unfortunately useMap is a hook and cannot be called here.
            // We will instead use the 'whenCreated' or similar if MapContainer supports it,
            // or just skip ChangeView if it's too complex for now.
        };
    }, []);

    return null;
}

export default function PropertyMap({ latitude, longitude, title, address }: PropertyMapProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const initIcons = async () => {
            const L = (await import('leaflet')).default;
            // @ts-ignore
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            });
        };
        initIcons();
    }, []);

    if (!mounted) return <div className="h-96 w-full bg-gray-100 animate-pulse rounded-xl" />;

    const position: [number, number] = (latitude && longitude) ? [latitude, longitude] : [6.5244, 3.3792];

    return (
        <div className="h-96 w-full rounded-xl overflow-hidden shadow-inner border border-gray-200">
            <MapContainer
                center={position}
                zoom={14}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position}>
                    <Popup>
                        <div className="font-semibold">{title}</div>
                        {address && <div className="text-xs text-gray-500 mt-1">{address}</div>}
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
}
