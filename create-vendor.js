// Simple script to create a vendor account
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createVendor = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if vendor already exists
    const existingVendor = await User.findOne({ email: 'vendor@test.com' });
    if (existingVendor) {
      console.log('✅ Vendor already exists:');
      console.log({
        email: 'vendor@test.com',
        password: 'vendor123',
        name: existingVendor.name,
        role: existingVendor.role,
        id: existingVendor._id
      });
      process.exit(0);
    }

    // Create vendor account
    const vendor = new User({
      name: 'Test Vendor',
      email: 'vendor@test.com',
      phone: '+251911111111',
      password: 'vendor123',
      role: 'vendor',
      isActive: true,
      phoneIsVerified: true,
      emailIsVerified: true,
      address: {
        street: '123 Market Street',
        city: 'Addis Ababa',
        state: 'Addis Ababa',
        zipCode: '1000',
        country: 'Ethiopia',
        coordinates: {
          type: 'Point',
          coordinates: [38.7469, 9.0320] // [longitude, latitude]
        }
      }
    });

    await vendor.save();
    console.log('✅ Vendor account created successfully!');
    console.log('\n📧 Login Credentials:');
    console.log('Email: vendor@test.com');
    console.log('Password: vendor123');
    console.log('\n👤 Vendor Details:');
    console.log('Name:', vendor.name);
    console.log('Phone:', vendor.phone);
    console.log('Role:', vendor.role);
    console.log('ID:', vendor._id);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating vendor:', error.message);
    process.exit(1);
  }
};

createVendor();
