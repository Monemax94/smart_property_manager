import axios from 'axios';
import mongoose from 'mongoose';
import { UserModel } from './models/User';
import { MONGO_URI } from './secrets';
import Jtoken from './middleware/Jtoken';

async function testFetch() {
  await mongoose.connect(MONGO_URI);
  const user = await UserModel.findOne({ email: 'admin_seed@smarthome.com' });
  const jtoken = new Jtoken();
  const tokens = await jtoken.createToken({
      email: user.email,
      role: user.role,
      _id: user._id.toString()
  });
  
  try {
    const res = await axios.post('http://127.0.0.1:8080/api/addresses', {
        street: '123 Fake St',
        city: 'Lagos',
        state: 'LA',
        postalCode: '100001',
        country: 'Nigeria',
        type: 'normal'
    }, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
    });
    console.log('Created Data:', JSON.stringify(res.data, null, 2));

    const res2 = await axios.get('http://127.0.0.1:8080/api/addresses', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
    });
    console.log('Got Address Data:', JSON.stringify(res2.data, null, 2));
  } catch (err: any) {
    console.error('API Error:', err.response?.data || err.message);
  }
  process.exit(0);
}
testFetch();
