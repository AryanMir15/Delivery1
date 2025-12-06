const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function testVendorLogin() {
  try {
    console.log('🔵 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find vendor user
    console.log('🔍 Looking for vendor user...');
    const vendor = await User.findOne({ email: 'vendor@test.com' });
    
    if (!vendor) {
      console.log('❌ Vendor not found with email: vendor@test.com');
      console.log('\n📝 Creating test vendor...');
      
      const newVendor = new User({
        name: 'Test Vendor',
        email: 'vendor@test.com',
        password: 'vendor123',
        phone: '+1234567890',
        role: 'vendor',
        isActive: true,
      });
      
      await newVendor.save();
      console.log('✅ Test vendor created!');
      console.log('   Email: vendor@test.com');
      console.log('   Password: vendor123');
    } else {
      console.log('✅ Vendor found!');
      console.log('   ID:', vendor._id);
      console.log('   Name:', vendor.name);
      console.log('   Email:', vendor.email);
      console.log('   Role:', vendor.role);
      console.log('   Active:', vendor.isActive);
      
      // Test password
      const isValid = await vendor.comparePassword('vendor123');
      console.log('   Password valid:', isValid);
      
      if (!isValid) {
        console.log('\n⚠️  Password incorrect, updating...');
        vendor.password = 'vendor123';
        await vendor.save();
        console.log('✅ Password updated to: vendor123');
      }
      
      // Ensure vendor is active
      if (!vendor.isActive) {
        console.log('\n⚠️  Vendor is inactive, activating...');
        vendor.isActive = true;
        await vendor.save();
        console.log('✅ Vendor activated');
      }
    }
    
    console.log('\n✅ Vendor login should now work!');
    console.log('\n📱 Test in Vendor App:');
    console.log('   Email: vendor@test.com');
    console.log('   Password: vendor123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testVendorLogin();
