const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function migrateRestaurantRole() {
  try {
    console.log('🔵 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users with restaurant role
    console.log('🔍 Finding users with restaurant role...');
    const restaurantUsers = await User.find({ role: 'restaurant' });
    
    console.log(`📊 Found ${restaurantUsers.length} users with restaurant role\n`);
    
    if (restaurantUsers.length === 0) {
      console.log('✅ No users to migrate');
    } else {
      console.log('🔄 Migrating restaurant role to vendor role...\n');
      
      for (const user of restaurantUsers) {
        console.log(`   Migrating: ${user.email}`);
        console.log(`   Old role: restaurant`);
        
        user.role = 'vendor';
        await user.save();
        
        console.log(`   New role: vendor ✅\n`);
      }
      
      console.log(`✅ Successfully migrated ${restaurantUsers.length} users from restaurant to vendor role`);
    }
    
    // Verify migration
    console.log('\n🔍 Verifying migration...');
    const remainingRestaurant = await User.find({ role: 'restaurant' });
    const vendorUsers = await User.find({ role: 'vendor' });
    
    console.log(`   Restaurant role users: ${remainingRestaurant.length}`);
    console.log(`   Vendor role users: ${vendorUsers.length}`);
    
    if (remainingRestaurant.length === 0) {
      console.log('\n✅ Migration complete! No restaurant role users remaining.');
    } else {
      console.log('\n⚠️  Warning: Some restaurant role users still exist');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

migrateRestaurantRole();
