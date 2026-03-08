import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PropertyModel, PropertyType, PropertySubType, PropertyStatus, ListingType } from './models/Property';
import { AddressModel, AddressType } from './models/Address';
import { UserModel, UserRole, UserStatus } from './models/User';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

const seedProperties = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if there are users, create one if not
        let user = await UserModel.findOne({ role: UserRole.VENDOR });
        if (!user) {
            user = await UserModel.create({
                email: 'testvendor@example.com',
                password: 'Password123!',
                role: UserRole.VENDOR,
                status: 'offline',
                verified: true,
                isActive: true,
                isDeleted: false,
            });
            console.log('Created test user for properties');
        }

        const addresses = [
            { street: '123 Smart Ave', city: 'Lagos', state: 'Lagos', country: 'Nigeria', latitude: 6.5244, longitude: 3.3792 },
            { street: '456 Modern Blvd', city: 'Abuja', state: 'FCT', country: 'Nigeria', latitude: 9.0765, longitude: 7.3986 },
            { street: '789 Future St', city: 'Port Harcourt', state: 'Rivers', country: 'Nigeria', latitude: 4.8156, longitude: 7.0498 }
        ];

        let createdCount = 0;

        for (let i = 0; i < 6; i++) {
            const addrInfo = addresses[i % addresses.length];

            const address = await AddressModel.create({
                userId: user._id,
                type: AddressType.PROPERTY,
                street: addrInfo.street,
                city: addrInfo.city,
                state: addrInfo.state,
                country: addrInfo.country,
                isDefault: false,
                latitude: addrInfo.latitude,
                longitude: addrInfo.longitude
            });

            const isRent = i % 2 === 0;

            const newProperty = await PropertyModel.create({
                title: `Beautiful ${isRent ? 'Rental' : 'Sale'} Property ${i + 1}`,
                description: `This is a highly sought after property located in ${addrInfo.city}. It features modern amenities and a smart home setup. Perfect for families or professionals looking for comfort.`,
                propertyType: PropertyType.RESIDENTIAL,
                propertySubType: PropertySubType.APARTMENT,
                status: PropertyStatus.ACTIVE,
                listingType: isRent ? ListingType.FOR_RENT : ListingType.FOR_SALE,
                ownerId: user._id,
                addressId: address._id,
                location: {
                    type: 'Point',
                    coordinates: [addrInfo.longitude, addrInfo.latitude],
                },
                features: {
                    bedrooms: 2 + (i % 3),
                    bathrooms: 1 + (i % 2),
                    builtUpArea: 1000 + (i * 200),
                    hasBalcony: true,
                    hasPowerBackup: true,
                    hasInternet: true,
                    parkingSpots: 1 + (i % 2),
                },
                pricing: {
                    rentPrice: isRent ? 1500 + i * 100 : undefined,
                    salePrice: !isRent ? 250000 + i * 10000 : undefined,
                    currency: 'USD',
                },
                images: [
                    {
                        url: `https://images.unsplash.com/photo-${1502005097973 + i * 1000}-4d048bcf0475?w=500&h=500&fit=crop`,
                        fileName: `house_${i}.jpg`,
                        mimeType: 'image/jpeg',
                        size: 150000,
                        publicId: `pub_${i}`,
                        format: 'JPEG',
                        fileType: 'image/jpeg',
                        fileSize: 150000
                    }
                ],
                amenities: ['Pool', 'Gym', 'Smart Lock', 'Security Camera'],
                isVerified: true
            });

            // Update address with propertyId to satisfy any potential constraints or just for linkage
            address.propertyId = newProperty._id as mongoose.Types.ObjectId;
            await address.save();

            createdCount++;
        }

        console.log(`Successfully seeded ${createdCount} properties.`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error seeding properties:', error);
        process.exit(1);
    }
};

seedProperties();
