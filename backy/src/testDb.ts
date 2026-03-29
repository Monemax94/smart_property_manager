import mongoose from 'mongoose';
import { AddressModel } from './models/Address';
import { UserModel } from './models/User';
import { MONGO_URI } from './secrets';

async function test() {
    await mongoose.connect(MONGO_URI);
    const user = await UserModel.findOne({ email: 'admin_seed@smarthome.com' });
    if (!user) {
        console.log('No user');
    } else {
        const addresses = await AddressModel.find({ user: user._id });
        console.log('User ID:', user._id);
        console.log('Addresses:', addresses);
    }
    process.exit(0);
}
test();
