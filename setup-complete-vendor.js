// Complete vendor setup with shop, categories, and products
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const Category = require('./models/Category');
const Food = require('./models/Food');
const Variation = require('./models/Variation');

const setupVendor = async () => {
  try {
    console.log('🚀 Setting up complete vendor account...\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Create/Get Vendor User
    let vendor = await User.findOne({ email: 'vendor@test.com' });
    if (!vendor) {
      vendor = new User({
        name: 'Fresh Market Vendor',
        email: 'vendor@test.com',
        phone: '+251911111111',
        password: 'vendor123',
        role: 'restaurant',
        isActive: true,
        phoneIsVerified: true,
        emailIsVerified: true,
      });
      await vendor.save();
      console.log('✅ Vendor user created');
    } else {
      console.log('✅ Vendor user exists');
    }

    // 2. Create Category (Fruits)
    let category = await Category.findOne({ title: 'Fruits' });
    if (!category) {
      category = new Category({
        title: 'Fruits',
        description: 'Fresh fruits and vegetables',
        businessType: 'grocery',
        icon: '🍎',
        color: '#4CAF50',
        isActive: true,
        sortOrder: 1
      });
      await category.save();
      console.log('✅ Fruits category created');
    } else {
      console.log('✅ Fruits category exists');
    }

    // 3. Create Shop/Restaurant
    let shop = await Restaurant.findOne({ owner: vendor._id });
    if (!shop) {
      shop = new Restaurant({
        name: 'Fresh Market Shop',
        slug: 'fresh-market-shop',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
        logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
        address: 'Bole Road, Addis Ababa, Ethiopia',
        location: {
          type: 'Point',
          coordinates: [38.7469, 9.0320] // [longitude, latitude]
        },
        phone: '+251911111111',
        email: 'shop@freshmarket.com',
        owner: vendor._id,
        shopType: 'grocery',
        cuisines: ['Fresh Produce', 'Organic', 'Local'],
        minimumOrder: 50,
        deliveryTime: 30,
        tax: 5,
        commissionRate: 10,
        isActive: true,
        isAvailable: true,
        rating: 4.5,
        reviewCount: 120,
        openingTimes: [
          {
            day: 'monday',
            times: [{ startTime: '08:00', endTime: '20:00' }]
          },
          {
            day: 'tuesday',
            times: [{ startTime: '08:00', endTime: '20:00' }]
          },
          {
            day: 'wednesday',
            times: [{ startTime: '08:00', endTime: '20:00' }]
          },
          {
            day: 'thursday',
            times: [{ startTime: '08:00', endTime: '20:00' }]
          },
          {
            day: 'friday',
            times: [{ startTime: '08:00', endTime: '20:00' }]
          },
          {
            day: 'saturday',
            times: [{ startTime: '08:00', endTime: '18:00' }]
          },
          {
            day: 'sunday',
            times: [{ startTime: '09:00', endTime: '16:00' }]
          }
        ]
      });
      await shop.save();
      console.log('✅ Shop created');
    } else {
      console.log('✅ Shop exists');
    }

    // 4. Create Products with Variations
    const products = [
      {
        title: 'Fresh Apples',
        description: 'Crispy red apples, locally sourced',
        image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500',
        price: 120,
        weight: '1 kg',
        organic: true
      },
      {
        title: 'Bananas',
        description: 'Sweet yellow bananas, perfect for smoothies',
        image: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=500',
        price: 80,
        weight: '1 kg',
        organic: false
      },
      {
        title: 'Oranges',
        description: 'Juicy oranges, rich in vitamin C',
        image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=500',
        price: 100,
        weight: '1 kg',
        organic: true
      },
      {
        title: 'Mangoes',
        description: 'Sweet tropical mangoes',
        image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500',
        price: 150,
        weight: '1 kg',
        organic: false
      },
      {
        title: 'Watermelon',
        description: 'Fresh watermelon, perfect for hot days',
        image: 'https://images.unsplash.com/photo-1587049352846-4a222e784720?w=500',
        price: 200,
        weight: '5 kg',
        organic: false
      }
    ];

    for (const productData of products) {
      const existingProduct = await Food.findOne({ 
        title: productData.title, 
        restaurant: shop._id 
      });

      if (!existingProduct) {
        // Create variation for the product
        const variation = new Variation({
          title: productData.weight,
          price: productData.price,
          discounted: Math.floor(productData.price * 0.9), // 10% discount
        });
        await variation.save();

        // Create product
        const product = new Food({
          title: productData.title,
          description: productData.description,
          image: productData.image,
          category: category._id,
          restaurant: shop._id,
          variations: [variation._id],
          isActive: true,
          isOutOfStock: false,
          attributes: {
            weight: productData.weight,
            organic: productData.organic,
            brand: 'Fresh Market',
            origin: 'Ethiopia',
            storageInstructions: 'Keep in cool, dry place',
            inStock: true,
            freeShipping: false
          }
        });
        await product.save();
        console.log(`✅ Product created: ${productData.title}`);
      } else {
        console.log(`✅ Product exists: ${productData.title}`);
      }
    }

    console.log('\n🎉 Complete vendor setup finished!\n');
    console.log('📧 Login Credentials:');
    console.log('   Email: vendor@test.com');
    console.log('   Password: vendor123');
    console.log('\n🏪 Shop Details:');
    console.log('   Name:', shop.name);
    console.log('   Type:', shop.shopType);
    console.log('   Address:', shop.address);
    console.log('   ID:', shop._id);
    console.log('\n📦 Products: 5 fruit products created');
    console.log('   Category: Fruits');
    console.log('\n✅ Ready to use in mobile app!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

setupVendor();
