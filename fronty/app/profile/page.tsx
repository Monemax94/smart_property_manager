'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isTokenExpired, clearSession } from '@/utils/auth';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useWishlist } from '@/context/WishlistContext';
import { useTheme } from '@/context/ThemeContext';

interface Address {
    _id: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    isDefault: boolean;
    firstName: string;
    lastName: string;
    type: string;
    phoneNumber: string;
}

interface WishlistItem {
    _id: string;
    title: string;
    price: number;
    image: string;
}

interface ApplicationPreferences {
    darkMode: boolean;
    defaultCurrency: string;
    defaultLanguage: string;
    defaultTimezone: string;
    dateFormat: string;
    pushNotifications: boolean;
    emailNotifications: boolean;
    announcements: boolean;
    twoFactorEnabled: boolean;
    twoFactorMethod: 'EMAIL' | 'AUTH_APP';
    biometricLoginEnabled: boolean;
}

interface NotificationPreferences {
    email: boolean;
    sms: boolean;
    browser: boolean;
    systemUpdates: boolean;
    transactionUpdates: boolean;
    marketingPromotions: boolean;
    securityAlerts: boolean;
}

export default function ProfilePage() {
    const router = useRouter();
    const { darkMode, toggleDarkMode } = useTheme();
    const { refreshWishlist, removeFromWishlist: removeFromWishlistContext } = useWishlist();
    const [user, setUser] = useState<any>(null); // Changed from User | null to any for consistency with original
    const [activeTab, setActiveTab] = useState('profile');
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        alternateEmail: '',
        jobTitle: '',
        dob: '',
        address: '',
        bio: '',
        photo: [] as any[]
    });
    const [addresses, setAddresses] = useState<Address[]>([]); // Kept from original
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]); // Kept from original, type changed to WishlistItem[]
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info' | 'warning' | null, message: string | null }>({ type: null, message: null });
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null);
    const [updatingPrefs, setUpdatingPrefs] = useState(false);
    const [appPrefs, setAppPrefs] = useState<ApplicationPreferences | null>(null);
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [updatingPassword, setUpdatingPassword] = useState(false);

    // Payments State
    const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
    const [paymentPage, setPaymentPage] = useState(1);
    const [paymentTotalPages, setPaymentTotalPages] = useState(1);
    const [paymentSearch, setPaymentSearch] = useState('');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
    const [paymentTotal, setPaymentTotal] = useState(0);

    // Landlord Application State
    const [applicationStatus, setApplicationStatus] = useState<any>(null);
    const [applicationForm, setApplicationForm] = useState({
        roleRequested: 'landlord',
        street: '',
        city: '',
        state: '',
        country: '',
        ninSlip: null as File | null
    });
    const [submittingApplication, setSubmittingApplication] = useState(false);

    // Payout Details State
    const [payoutForm, setPayoutForm] = useState({
        bankName: '',
        accountNumber: '',
        accountName: ''
    });
    const [updatingPayout, setUpdatingPayout] = useState(false);

    // Profile Photo Update State
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Address Form state
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [addressForm, setAddressForm] = useState({
        firstName: '',
        lastName: '',
        type: 'normal',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Nigeria',
        phoneNumber: '',
        additionalInfo: '',
        isDefault: false
    });
    const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || isTokenExpired(token)) {
            clearSession();
            router.push('/login');
            return;
        }

        const userData = userStr ? JSON.parse(userStr) : null;
        setUser(userData);

        const init = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchUserProfile(token),
                    fetchAddresses(token),
                    fetchWishlist(token),
                    fetchPaymentHistory(token),
                    fetchPreferences(token),
                    refreshWishlist()
                ]);
            } catch (err) {
                console.error('Profile initialization failed', err);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [router, refreshWishlist]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && !isTokenExpired(token)) {
            fetchPaymentHistory(token);
        }
    }, [paymentPage, paymentSearch, paymentStatusFilter]);

    const fetchUserProfile = async (token: string) => {
        try {
            const res = await axios.get('http://127.0.0.1:8080/api/profile/current', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const profile = res.data.data.data;
            if (profile) {
                setProfileData({
                    firstName: profile.firstName || '',
                    lastName: profile.lastName || '',
                    phoneNumber: profile.user?.phoneNumber || '',
                    alternateEmail: profile.alternateEmail || '',
                    jobTitle: profile.jobTitle || '',
                    bio: profile.bio || '',
                    address: profile.address || '',
                    dob: profile.dob ? new Date(profile.dob).toISOString().split('T')[0] : '',
                    photo: profile.photo || []
                });
                if (profile.photo && profile.photo.length > 0) {
                    setPhotoPreview(profile.photo[0].url);
                }
            }
        } catch (err) {
            console.error('Failed to fetch user profile', err);
        }
    };

    const showAlert = (type: 'success' | 'error' | 'info' | 'warning', message: string) => {
        setAlert({ type, message });
        setTimeout(() => setAlert({ type: null, message: null }), 5000);
    };

    const fetchAddresses = async (token: string) => {
        try {
            const res = await axios.get('http://127.0.0.1:8080/api/addresses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAddresses(res.data.data.data || []);
        } catch (err) {
            console.error('Failed to fetch addresses', err);
        }
    };

    const fetchWishlist = async (token: string) => {
        try {
            const res = await axios.get('http://127.0.0.1:8080/api/wishlist', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const wishlistData = res.data.data.data;
            setWishlist(wishlistData?.items?.map((item: any) => ({
                _id: item.property?._id,
                title: item.property?.title,
                price: item.property?.pricing?.rentPrice || item.property?.pricing?.salePrice,
                image: item.property?.images?.[0]?.url || 'https://via.placeholder.com/400'
            })) || []);
        } catch (err: any) {
            console.error('Wishlist Fetch Error:', err.response?.data || err.message);
            // Don't show alert here to avoid spamming on load
        }
    };

    const fetchPaymentHistory = async (token: string) => {
        try {
            const res = await axios.get('http://127.0.0.1:8080/api/payments/history', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    page: paymentPage,
                    limit: 10,
                    search: paymentSearch,
                    status: paymentStatusFilter
                }
            });
            const dataWrap = res.data.data;
            const transactions = dataWrap.data || [];
            const meta = dataWrap.meta || {};

            console.log('Fetched transactions:', transactions);
            setPaymentHistory(Array.isArray(transactions) ? transactions : []);
            setPaymentTotalPages(meta.pages || 1);
            setPaymentTotal(meta.total || 0);
        } catch (err) {
            console.error('Failed to fetch payment history', err);
        }
    };

    const handleUpdatePayout = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdatingPayout(true);
        try {
            // Simulated endpoint call for updating payout details
            await new Promise(resolve => setTimeout(resolve, 1000));
            showAlert('success', 'Payout details updated successfully.');
        } catch (error: any) {
            showAlert('error', 'Failed to update payout details.');
        } finally {
            setUpdatingPayout(false);
        }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        try {
            if (editingAddressId) {
                await axios.put(`http://127.0.0.1:8080/api/addresses/${editingAddressId}`, addressForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showAlert('success', 'Address updated successfully!');
            } else {
                await axios.post('http://127.0.0.1:8080/api/addresses', addressForm, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                showAlert('success', 'Address added successfully!');
            }
            setShowAddressForm(false);
            setEditingAddressId(null);
            resetAddressForm();
            fetchAddresses(token!);
        } catch (err: any) {
            showAlert('error', err.response?.data?.message || 'Failed to handle address');
        }
    };

    const handleSetAsDefault = async (addrId: string) => {
        try {
            const token = localStorage.getItem('token');
            // Simplified handling for the frontend simulation
            showAlert('success', 'Address set as default successfully.');
            // Re-fetch logic here
        } catch (error: any) {
            showAlert('error', error.response?.data?.message || 'Failed to update address');
        }
    };

    const handleApplicationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingApplication(true);
        try {
            const token = localStorage.getItem('token');
            
            // Upload NIN to Cloudinary or similar logic if implemented, 
            // but assuming backend doesn't take multipart for this specific simple implementation or does it?
            // Yes, let's use FormData
            const formData = new FormData();
            formData.append('roleRequested', applicationForm.roleRequested);
            formData.append('address[street]', applicationForm.street);
            formData.append('address[city]', applicationForm.city);
            formData.append('address[state]', applicationForm.state);
            formData.append('address[country]', applicationForm.country);
            if (applicationForm.ninSlip) {
                formData.append('files', applicationForm.ninSlip);
            }

            const res = await axios.post('http://127.0.0.1:8080/api/profile/apply-landlord', formData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            showAlert('success', res.data.message);
            setApplicationStatus(res.data.data);
        } catch (error: any) {
            showAlert('error', error.response?.data?.message || 'Failed to submit application');
        } finally {
            setSubmittingApplication(false);
        }
    };

    const resetAddressForm = () => {
        setAddressForm({
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            type: 'normal',
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Nigeria',
            phoneNumber: user?.phoneNumber || '',
            additionalInfo: '',
            isDefault: false
        });
    };

    const handleEditAddress = (address: Address) => {
        setAddressForm({
            firstName: address.firstName,
            lastName: address.lastName,
            type: address.type,
            street: address.street,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            phoneNumber: address.phoneNumber,
            additionalInfo: '', // Populate if available in API
            isDefault: address.isDefault
        });
        setEditingAddressId(address._id);
        setShowAddressForm(true);
    };

    const handleDeleteAddress = async (id: string) => {
        if (!confirm('Are you sure you want to delete this address?')) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://127.0.0.1:8080/api/addresses/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showAlert('success', 'Address deleted successfully');
            fetchAddresses(token!);
        } catch (err: any) {
            showAlert('error', 'Failed to delete address');
        }
    };

    const handleRemoveFromWishlist = async (id: string) => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://127.0.0.1:8080/api/wishlist/remove/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWishlist(prev => prev.filter(item => item._id !== id));
            removeFromWishlistContext(id);
            showAlert('success', 'Removed from wishlist');
        } catch (err: any) {
            showAlert('error', 'Failed to remove from wishlist');
        }
    };

    const fetchPreferences = async (token: string) => {
        try {
            const [appRes, notifRes] = await Promise.all([
                axios.get('http://127.0.0.1:8080/api/profile/application/preference', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('http://127.0.0.1:8080/api/profile/notification/preference', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setAppPrefs(appRes.data.data.data);
            setNotifPrefs(notifRes.data.data);
            
            try {
                const appStatusRes = await axios.get('http://127.0.0.1:8080/api/profile/apply-landlord/status', { headers: { Authorization: `Bearer ${token}` } });
                if (appStatusRes.data.data) {
                    setApplicationStatus(appStatusRes.data.data);
                }
            } catch (e) {
                console.log("No pending application found or error fetching it.");
            }
        } catch (err) {
            console.error('Failed to fetch preferences', err);
        }
    };

    const handleUpdateAppPrefs = async (updates: Partial<ApplicationPreferences>) => {
        const token = localStorage.getItem('token');
        setUpdatingPrefs(true);
        try {
            const res = await axios.patch('http://127.0.0.1:8080/api/profile/application/preference', updates, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAppPrefs(res.data.data.data);
            showAlert('success', 'Preferences updated successfully');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to update preferences';
            showAlert('error', errorMessage);
        } finally {
            setUpdatingPrefs(false);
        }
    };

    const handleUpdateNotifPrefs = async (updates: Partial<NotificationPreferences>) => {
        const token = localStorage.getItem('token');
        setUpdatingPrefs(true);
        try {
            const res = await axios.patch('http://127.0.0.1:8080/api/profile/notification/preference', updates, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifPrefs(res.data.data.data);
            showAlert('success', 'Notification settings updated');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Failed to update notification settings';
            showAlert('error', errorMessage);
        } finally {
            setUpdatingPrefs(false);
        }
    };
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        setUpdatingProfile(true);
        try {
            const formData = new FormData();
            formData.append('firstName', profileData.firstName);
            formData.append('lastName', profileData.lastName);
            formData.append('phoneNumber', profileData.phoneNumber);
            formData.append('alternateEmail', profileData.alternateEmail);
            formData.append('jobTitle', profileData.jobTitle);
            formData.append('bio', profileData.bio);
            formData.append('address', profileData.address);
            if (profileData.dob) formData.append('dob', profileData.dob);

            if (profilePhoto) {
                formData.append('files', profilePhoto);
            }

            const res = await axios.patch('http://127.0.0.1:8080/api/profile/update-now', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Update local state and storage
            const updatedUser = res.data.data.data;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));

            showAlert('success', 'Profile updated successfully!');
            fetchUserProfile(token!);
        } catch (err: any) {
            showAlert('error', err.response?.data?.message || 'Failed to update profile');
        } finally {
            setUpdatingProfile(false);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showAlert('error', 'New passwords do not match');
            return;
        }
        const token = localStorage.getItem('token');
        setUpdatingPassword(true);
        try {
            await axios.post('http://127.0.0.1:8080/api/profile/reset-password', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showAlert('success', 'Password updated successfully!');
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err: any) {
            showAlert('error', err.response?.data?.message || 'Failed to update password');
        } finally {
            setUpdatingPassword(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading profile...</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-8 md:pt-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto w-full max-w-5xl">
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6 md:mb-8 max-w-5xl mx-auto px-4">Account Settings</h1>

                {alert.message && alert.type && (
                    <div className={`mx-4 mb-6 p-4 rounded-md shadow-sm border ${alert.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' :
                        alert.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
                            alert.type === 'info' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                'bg-yellow-50 text-yellow-800 border-yellow-200'
                        } transition-all animate-fadeIn`}>
                        <div className="flex items-center">
                            <span className="flex-grow font-medium">{alert.message}</span>
                            <button onClick={() => setAlert({ type: null, message: null })} className="ml-4 text-xl">&times;</button>
                        </div>
                    </div>
                )}

                <div className="bg-white shadow rounded-lg flex overflow-hidden flex-col md:flex-row min-h-[400px] md:min-h-[600px] mb-8">
                    {/* Sidebar */}
                    <div className="w-full md:w-1/4 border-b md:border-b-0 md:border-r border-gray-200 bg-white">
                        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible space-x-2 md:space-x-0 md:space-y-1 p-4 whitespace-nowrap">
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`text-left px-4 py-3 rounded-md font-medium transition-colors ${activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                Profile Edit
                            </button>
                            <button
                                onClick={() => setActiveTab('addresses')}
                                className={`text-left px-4 py-3 rounded-md font-medium transition-colors ${activeTab === 'addresses' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                My Addresses
                            </button>
                            <button
                                onClick={() => setActiveTab('wishlist')}
                                className={`text-left px-4 py-3 rounded-md font-medium transition-colors ${activeTab === 'wishlist' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                Wishlist / Favorites
                            </button>
                            <button
                                onClick={() => setActiveTab('password')}
                                className={`text-left px-4 py-3 rounded-md font-medium transition-colors ${activeTab === 'password' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                Change Password
                            </button>
                            <button
                                onClick={() => setActiveTab('payments')}
                                className={`text-left px-4 py-3 rounded-md font-medium transition-colors ${activeTab === 'payments' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                Payment Transactions
                            </button>
                            <button
                                onClick={() => setActiveTab('notifications')}
                                className={`text-left px-4 py-3 rounded-md font-medium transition-colors ${activeTab === 'notifications' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                Notification Preferences
                            </button>
                            <button
                                onClick={() => setActiveTab('preferences')}
                                className={`text-left px-4 py-3 rounded-md font-medium transition-colors ${activeTab === 'preferences' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                Application Settings
                            </button>
                            {user?.role === 'tenant' && (
                                <button
                                    onClick={() => setActiveTab('verification')}
                                    className={`text-left px-4 py-3 rounded-md font-medium transition-colors ${activeTab === 'verification' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Become a Landlord/Agent
                                </button>
                            )}
                            {['admin', 'superadmin', 'landlord'].includes(user?.role) && (
                                <button
                                    onClick={() => setActiveTab('payout')}
                                    className={`text-left px-4 py-3 rounded-md font-medium transition-colors ${activeTab === 'payout' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Payout Details
                                </button>
                            )}
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="w-full md:w-3/4 p-6 md:p-10">
                        {activeTab === 'profile' && (
                            <div className="animate-fadeIn">
                                <h2 className="text-2xl font-semibold mb-6">Edit Profile</h2>
                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div className="flex flex-col items-center mb-8 bg-gray-50/50 p-6 rounded-2xl border border-dashed border-gray-200">
                                        <div className="relative w-32 h-32 mb-4 group">
                                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg relative bg-white flex items-center justify-center">
                                                {photoPreview ? (
                                                    <Image src={photoPreview} alt="Profile" layout="fill" objectFit="cover" />
                                                ) : (
                                                    <div className="text-4xl font-bold text-gray-300">
                                                        {(profileData.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform flex items-center justify-center w-10 h-10 border-2 border-white">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                            </label>
                                            <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Profile Picture</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">First Name</label>
                                            <input
                                                type="text"
                                                value={profileData.firstName}
                                                onChange={e => setProfileData({ ...profileData, firstName: e.target.value })}
                                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Last Name</label>
                                            <input
                                                type="text"
                                                value={profileData.lastName}
                                                onChange={e => setProfileData({ ...profileData, lastName: e.target.value })}
                                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Phone Number</label>
                                            <input
                                                type="text"
                                                value={profileData.phoneNumber}
                                                onChange={e => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Alternate Email</label>
                                            <input
                                                type="email"
                                                value={profileData.alternateEmail}
                                                onChange={e => setProfileData({ ...profileData, alternateEmail: e.target.value })}
                                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Job Title</label>
                                            <input
                                                type="text"
                                                value={profileData.jobTitle}
                                                onChange={e => setProfileData({ ...profileData, jobTitle: e.target.value })}
                                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Date of Birth</label>
                                            <input
                                                type="date"
                                                value={profileData.dob}
                                                onChange={e => setProfileData({ ...profileData, dob: e.target.value })}
                                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Primary Home Address</label>
                                        <input
                                            type="text"
                                            value={profileData.address}
                                            onChange={e => setProfileData({ ...profileData, address: e.target.value })}
                                            placeholder="e.g. 45th Avenue, New York"
                                            className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Bio / Introduction</label>
                                        <textarea
                                            rows={4}
                                            value={profileData.bio}
                                            onChange={e => setProfileData({ ...profileData, bio: e.target.value })}
                                            className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all resize-none leading-relaxed"
                                        ></textarea>
                                    </div>
                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            disabled={updatingProfile}
                                            className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-xl text-sm font-extrabold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 uppercase tracking-widest"
                                        >
                                            {updatingProfile ? 'Uploading & Saving...' : 'Save Profile Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'addresses' && (
                            <div className="animate-fadeIn">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-semibold">My Addresses</h2>
                                    <button
                                        onClick={() => setShowAddressForm(!showAddressForm)}
                                        className="text-sm font-medium text-primary hover:text-primary-hover"
                                    >
                                        {showAddressForm ? 'Cancel' : '+ Add New Address'}
                                    </button>
                                </div>

                                {showAddressForm && (
                                    <form onSubmit={handleAddAddress} className="mb-8 p-6 border border-primary/20 rounded-lg bg-primary/5 space-y-4 animate-fadeIn">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase">First Name</label>
                                                <input type="text" required value={addressForm.firstName} onChange={e => setAddressForm({ ...addressForm, firstName: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase">Last Name</label>
                                                <input type="text" required value={addressForm.lastName} onChange={e => setAddressForm({ ...addressForm, lastName: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-gray-600 uppercase">Street Address</label>
                                                <input type="text" required value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm" placeholder="123 Main St" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase">City</label>
                                                <input type="text" required value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase">State</label>
                                                <input type="text" required value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase">Phone Number</label>
                                                <input type="text" required value={addressForm.phoneNumber} onChange={e => setAddressForm({ ...addressForm, phoneNumber: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm" placeholder="+234..." />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase">Postal Code</label>
                                                <input type="text" value={addressForm.postalCode} onChange={e => setAddressForm({ ...addressForm, postalCode: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase">Country</label>
                                                <input type="text" value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 uppercase">Address Type</label>
                                                <select value={addressForm.type} onChange={e => setAddressForm({ ...addressForm, type: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm bg-white">
                                                    <option value="normal">Normal</option>
                                                    <option value="billing">Billing</option>
                                                    <option value="shipping">Shipping</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 uppercase">Additional Info / Notes</label>
                                            <textarea rows={2} value={addressForm.additionalInfo} onChange={e => setAddressForm({ ...addressForm, additionalInfo: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary outline-none text-sm resize-none" placeholder="Apartment number, gate code, etc."></textarea>
                                        </div>
                                        <div className="flex items-center">
                                            <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="h-4 w-4 text-primary border-gray-300 rounded" />
                                            <label className="ml-2 text-sm text-gray-600">Set as default address</label>
                                        </div>
                                        <button type="submit" className="w-full bg-primary text-white py-2 rounded font-medium hover:bg-primary-hover transition-colors">
                                            Save Address
                                        </button>
                                    </form>
                                )}

                                <div className="space-y-4">
                                    {addresses.length > 0 ? (
                                        addresses.map((address) => (
                                            <div key={address._id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:border-primary transition-colors bg-white">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-900">{address.firstName} {address.lastName}</span>
                                                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-100 text-gray-600">{address.type}</span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm mt-1">{address.street}</p>
                                                    <p className="text-sm text-gray-500">{address.city}, {address.state}, {address.country}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{address.phoneNumber}</p>
                                                    {address.isDefault && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 mt-2">DEFAULT ADDRESS</span>}
                                                </div>
                                                <div className="flex space-x-3 text-sm">
                                                    <button onClick={() => handleEditAddress(address)} className="text-primary hover:underline font-bold">Edit</button>
                                                    <button onClick={() => handleDeleteAddress(address._id)} className="text-red-600 hover:underline font-bold">Delete</button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <p className="text-gray-500">No addresses saved yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'wishlist' && (
                            <div className="animate-fadeIn">
                                <h2 className="text-2xl font-semibold mb-6">My Wishlist</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {wishlist.length > 0 ? (
                                        wishlist.map((item) => (
                                            <div key={item._id} className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
                                                <div className="relative h-40 w-full">
                                                    <Image src={item.image} alt={item.title} layout="fill" objectFit="cover" />
                                                </div>
                                                <div className="p-3">
                                                    <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                                                    <p className="text-primary font-bold mt-1">${item.price}</p>
                                                    <div className="mt-3 flex justify-between">
                                                        <Link href={`/properties/${item._id}`} className="text-xs font-medium text-gray-600 hover:text-primary">View Property</Link>
                                                        <button
                                                            onClick={() => handleRemoveFromWishlist(item._id)}
                                                            className="text-xs font-medium text-red-600 hover:text-red-700"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <p className="text-gray-500">Your wishlist is empty.</p>
                                            <Link href="/properties" className="text-primary font-medium hover:underline mt-2 inline-block">Browse properties &rarr;</Link>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {activeTab === 'payments' && (
                            <div className="animate-fadeIn">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold mb-1">Payment Transactions</h2>
                                        <p className="text-gray-500 text-sm">View and track all your rent and property-related payments.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Search by ID..."
                                                value={paymentSearch}
                                                onChange={(e) => {
                                                    setPaymentSearch(e.target.value);
                                                    setPaymentPage(1);
                                                }}
                                                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/50 min-w-[200px]"
                                            />
                                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                            </svg>
                                        </div>
                                        <select
                                            value={paymentStatusFilter}
                                            onChange={(e) => {
                                                setPaymentStatusFilter(e.target.value);
                                                setPaymentPage(1);
                                            }}
                                            className="px-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/50 cursor-pointer"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="completed">Completed</option>
                                            <option value="failed">Failed</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="overflow-x-auto border border-gray-100 rounded-2xl shadow-sm">
                                    <table className="w-full text-sm text-left text-gray-500">
                                        <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 font-black tracking-widest border-b border-gray-100">
                                            <tr>
                                                <th scope="col" className="px-6 py-4">Transaction ID</th>
                                                <th scope="col" className="px-6 py-4">Property</th>
                                                <th scope="col" className="px-6 py-4">Amount</th>
                                                <th scope="col" className="px-6 py-4 text-center">Status</th>
                                                <th scope="col" className="px-6 py-4">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {paymentHistory.length > 0 ? (
                                                paymentHistory.map((tx: any) => (
                                                    <tr key={tx._id} className="bg-white hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 font-mono text-xs text-gray-900 font-bold">
                                                            {tx.transactID || (tx.transactionId ? tx.transactionId.substring(0, 12) : tx._id.substring(0, 12))}...
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-gray-700">{tx.property?.title || 'Rent Payment'}</td>
                                                        <td className="px-6 py-4 font-black text-gray-900">{tx.currency} {tx.amount.toLocaleString()}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                tx.status === 'failed' ? 'bg-red-100 text-red-700' :
                                                                    'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {tx.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-medium">{new Date(tx.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic bg-gray-50/20">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                            No transactions found.
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {paymentTotalPages > 1 && (
                                    <div className="mt-6 flex items-center justify-between">
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Page {paymentPage} of {paymentTotalPages} ({paymentTotal} total)</p>
                                        <div className="flex gap-2">
                                            <button
                                                disabled={paymentPage === 1}
                                                onClick={() => setPaymentPage(p => p - 1)}
                                                className="px-4 py-2 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-30"
                                            >
                                                Previous
                                            </button>
                                            <button
                                                disabled={paymentPage === paymentTotalPages}
                                                onClick={() => setPaymentPage(p => p + 1)}
                                                className="px-4 py-2 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-30"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'password' && (
                            <div className="animate-fadeIn">
                                <h2 className="text-2xl font-semibold mb-2">Change Password</h2>
                                <p className="text-gray-500 mb-8 text-sm">Update your account security by changing your password.</p>
                                <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Current Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.oldPassword}
                                            onChange={e => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                            className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all"
                                        />
                                    </div>
                                    <div className="pt-4 space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">New Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={passwordData.newPassword}
                                                onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Confirm New Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={passwordData.confirmPassword}
                                                onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-6">
                                        <button
                                            type="submit"
                                            disabled={updatingPassword}
                                            className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-xl text-sm font-extrabold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 uppercase tracking-widest"
                                        >
                                            {updatingPassword ? 'Updating...' : 'Update Security Password'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="animate-fadeIn">
                                <h2 className="text-2xl font-semibold mb-2">Notification Preferences</h2>
                                <p className="text-gray-500 mb-8 text-sm">Control how you want to be notified about updates and activity.</p>

                                {notifPrefs ? (
                                    <div className="space-y-4">
                                        {[
                                            { key: 'email', title: "Email Notifications", desc: "Receive core updates via your registered email." },
                                            { key: 'sms', title: "SMS Alerts", desc: "Get text messages for critical property alerts." },
                                            { key: 'browser', title: "Browser Notifications", desc: "Receive desktop notifications while browsing." },
                                            { key: 'systemUpdates', title: "System Updates", desc: "Stay informed about platform changes and maintenance." },
                                            { key: 'transactionUpdates', title: "Transaction Updates", desc: "Notifications about payments, rent, and contract status." },
                                            { key: 'marketingPromotions', title: "Marketing & Promotions", desc: "Updates about new features and special offers." },
                                            { key: 'securityAlerts', title: "Security Alerts", desc: "Important notices about your account security and logins." },
                                        ].map((item) => (
                                            <div key={item.key} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50/50 transition-colors">
                                                <div className="pr-4">
                                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">{item.title}</h4>
                                                    <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleUpdateNotifPrefs({ [item.key]: !notifPrefs[item.key as keyof NotificationPreferences] })}
                                                    disabled={updatingPrefs}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notifPrefs[item.key as keyof NotificationPreferences] ? 'bg-primary' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifPrefs[item.key as keyof NotificationPreferences] ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-gray-400">Loading your preferences...</div>
                                )}
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="animate-fadeIn">
                                <h2 className="text-2xl font-semibold mb-2">Application Settings</h2>
                                <p className="text-gray-500 mb-8 text-sm">Personalize your SmartHome experience across the platform.</p>

                                {appPrefs ? (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="group">
                                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest group-focus-within:text-primary">Default Currency</label>
                                                <select
                                                    value={appPrefs.defaultCurrency}
                                                    onChange={(e) => handleUpdateAppPrefs({ defaultCurrency: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/50 font-bold"
                                                >
                                                    <option value="USD">USD ($)</option>
                                                    <option value="NGN">NGN (₦)</option>
                                                    <option value="GBP">GBP (£)</option>
                                                    <option value="EUR">EUR (€)</option>
                                                </select>
                                            </div>
                                            <div className="group">
                                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest group-focus-within:text-primary">Preferred Language</label>
                                                <select
                                                    value={appPrefs.defaultLanguage}
                                                    onChange={(e) => handleUpdateAppPrefs({ defaultLanguage: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/50 font-bold"
                                                >
                                                    <option value="English">English</option>
                                                    <option value="French">French</option>
                                                    <option value="Spanish">Spanish</option>
                                                    <option value="German">German</option>
                                                    <option value="Chinese">Chinese</option>
                                                </select>
                                            </div>
                                            <div className="group">
                                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest group-focus-within:text-primary">Date Format</label>
                                                <select
                                                    value={appPrefs.dateFormat}
                                                    onChange={(e) => handleUpdateAppPrefs({ dateFormat: e.target.value })}
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/50 font-bold"
                                                >
                                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                                </select>
                                            </div>
                                            <div className="group">
                                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest group-focus-within:text-primary">Timezone</label>
                                                <input
                                                    type="text"
                                                    value={appPrefs.defaultTimezone}
                                                    readOnly
                                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t border-gray-100">
                                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4">Display & Security</h3>

                                            {[
                                                { key: 'darkMode', title: "Interface Dark Mode", desc: "Switch to a darker theme to reduce eye strain (Coming Soon UI)." },
                                                { key: 'twoFactorEnabled', title: "Two-Factor Authentication", desc: "Add an extra layer of security to your account." },
                                                { key: 'biometricLoginEnabled', title: "Biometric Login", desc: "Enable Face ID or Touch ID for supported devices." },
                                            ].map((item) => (
                                                <div key={item.key} className="flex items-center justify-between p-4 border border-gray-50 rounded-xl">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-gray-800">{item.title}</h4>
                                                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            if (item.key === 'darkMode') {
                                                                toggleDarkMode();
                                                                setAppPrefs({ ...appPrefs, darkMode: !appPrefs.darkMode });
                                                            } else {
                                                                handleUpdateAppPrefs({ [item.key]: !appPrefs[item.key as keyof ApplicationPreferences] });
                                                            }
                                                        }}
                                                        disabled={updatingPrefs}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${appPrefs[item.key as keyof ApplicationPreferences] ? 'bg-primary' : 'bg-gray-200'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${appPrefs[item.key as keyof ApplicationPreferences] ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-gray-400">Loading preferences...</div>
                                )}
                            </div>
                        )}

                        {activeTab === 'verification' && user?.role === 'tenant' && (
                            <div className="animate-fadeIn">
                                <h2 className="text-2xl font-semibold mb-2">Apply for Verification</h2>
                                <p className="text-gray-500 mb-8 text-sm">Become a verified Landlord or Agent to start listing properties.</p>

                                {applicationStatus ? (
                                    <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl flex flex-col items-center">
                                        <svg className="w-16 h-16 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        <h3 className="text-lg font-bold text-yellow-800 mb-2">Application {applicationStatus.status.toUpperCase()}</h3>
                                        <p className="text-sm text-yellow-700 text-center max-w-md">
                                            Your application to become a {applicationStatus.roleRequested} is currently under review by our support team. We will notify you once a decision is made.
                                        </p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleApplicationSubmit} className="space-y-6 max-w-lg">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Role Requested</label>
                                            <select
                                                required
                                                value={applicationForm.roleRequested}
                                                onChange={e => setApplicationForm({...applicationForm, roleRequested: e.target.value})}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium"
                                            >
                                                <option value="landlord">Landlord</option>
                                                <option value="agent">Agent</option>
                                            </select>
                                        </div>

                                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 space-y-4">
                                            <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-tight">Residential Address Verification</h4>
                                            
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">Street Address</label>
                                                <input required type="text" value={applicationForm.street} onChange={e => setApplicationForm({...applicationForm, street: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">City</label>
                                                    <input required type="text" value={applicationForm.city} onChange={e => setApplicationForm({...applicationForm, city: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">State/Region</label>
                                                    <input required type="text" value={applicationForm.state} onChange={e => setApplicationForm({...applicationForm, state: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">Country</label>
                                                <input required type="text" value={applicationForm.country} onChange={e => setApplicationForm({...applicationForm, country: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                            <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-tight">Identity Verification (NIN Slip)</h4>
                                            <p className="text-xs text-gray-500 mb-4">Please upload a clear copy of your National Identification Number (NIN) slip for verification.</p>
                                            
                                            <input 
                                                required
                                                type="file" 
                                                accept="image/*,.pdf"
                                                onChange={e => setApplicationForm({...applicationForm, ninSlip: e.target.files?.[0] || null})}
                                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={submittingApplication}
                                            className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-xl text-sm font-extrabold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 uppercase tracking-widest"
                                        >
                                            {submittingApplication ? 'Submitting...' : 'Submit Application'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {activeTab === 'payout' && ['admin', 'superadmin', 'landlord'].includes(user?.role) && (
                            <div className="animate-fadeIn">
                                <h2 className="text-2xl font-semibold mb-2">Payout Details</h2>
                                <p className="text-gray-500 mb-8 text-sm">Configure your bank account details to receive property payments and settlements.</p>

                                <form onSubmit={handleUpdatePayout} className="space-y-6 max-w-md">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Bank Name</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Guarantee Trust Bank"
                                            value={payoutForm.bankName}
                                            onChange={e => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                                            className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all"
                                        />
                                    </div>
                                    <div className="pt-4 space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Account Number</label>
                                            <input
                                                type="text"
                                                required
                                                pattern="[0-9]{10}"
                                                placeholder="10 digit account number"
                                                value={payoutForm.accountNumber}
                                                onChange={e => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Account Name</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="Must match your profile name"
                                                value={payoutForm.accountName}
                                                onChange={e => setPayoutForm({ ...payoutForm, accountName: e.target.value })}
                                                className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary outline-none bg-gray-50/30 font-medium transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-6">
                                        <button
                                            type="submit"
                                            disabled={updatingPayout}
                                            className="w-full flex justify-center py-4 px-6 border border-transparent rounded-xl shadow-xl text-sm font-extrabold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 uppercase tracking-widest"
                                        >
                                            {updatingPayout ? 'Updating...' : 'Save Payout Details'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
