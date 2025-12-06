// Update vendor role to "restaurant" for ownerLogin access
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function updateVendorRole() {
  try {
    console.log('🔄 Updating vendor role...\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    const vendor = await User.findOne({ email: 'vendor@test.com' });
    
    if (!vendor) {
      console.log('❌ Vendor not found!');
      process.exit(1);
    }

    console.log('Current role:', vendor.role);
    
    vendor.role = 'restaurant';
    await vendor.save();
    
    console.log('✅ Vendor role updated to: restaurant');
    console.log('\n📱 Vendor App Login:');
    console.log('   Email: vendor@test.com');
    console.log('   Password: vendor123');
    console.log('   Role: restaurant (can use ownerLogin)');
    console.log('\n✅ Vendor can now login to vendor app!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateVendorRole();
