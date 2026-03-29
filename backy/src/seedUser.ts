import mongoose from 'mongoose';
import { UserModel, UserRole } from './models/User';
import ProfileModel from './models/Profile';
import { MONGO_URI } from './secrets';

async function seed() {
  try {
    console.log('Connecting to DB...', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'admin_seed@smarthome.com';
    const password = 'AdminPassword123!';

    // Check if exists
    let user = await UserModel.findOne({ email });
    if (!user) {
        user = new UserModel({
            email,
            password, // Hook will hash it
            role: UserRole.ADMIN,
            verified: true,
            isActive: true
        });
        await user.save();
        
        const newProfile = new ProfileModel({
            user: user._id,
            firstName: 'Super',
            lastName: 'Admin'
        });
        await newProfile.save();
        
        user.profile = newProfile._id;
        await user.save();
        
        console.log('Successfully seeded new admin!');
    } else {
        user.password = password;
        user.role = UserRole.ADMIN;
        user.verified = true;
        await user.save();
        console.log('Updated existing seed admin.');
    }

    console.log('=== Login Credentials ===');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('=========================');
    
  } catch (error) {
    console.error('Error seeding user:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();
