require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Category = require('./models/Category');
const Restaurant = require('./models/Restaurant');
const Food = require('./models/Food');
const Variation = require('./models/Variation');

const LAT = 25.7714;
const LNG = 68.6684;

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const makeTimes = (start, end) => days.map(day => ({ day, times: [{ startTime: start, endTime: end }] }));

function jitter(base, range) {
  return +(base + (Math.random() - 0.5) * range).toFixed(4);
}

const SHADOW_RESTAURANTS = [
  {
    name: 'Karachi Grill House',
    address: 'Station Road, Tando Allahyar',
    phone: '+923012345678',
    email: 'karachigrill@test.com',
    cuisines: ['Karachi', 'BBQ', 'Seafood'],
    minimumOrder: 250,
    deliveryTime: 35,
    rating: 4.3,
    reviewCount: 41,
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=400&fit=crop',
    openingTimes: makeTimes('11:00', '00:00'),
    foods: [
      { title: 'Grilled Chicken Platter', desc: 'Whole grilled chicken with mint chutney', cat: 'BBQ & Grills', price: 850, discounted: 0, image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=300&fit=crop' },
      { title: 'Fish Tikka', desc: 'Marinated river fish tikka pieces', cat: 'BBQ & Grills', price: 700, discounted: 0, image: 'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=400&h=300&fit=crop' },
      { title: 'Seekh Kebab', desc: '4 pcs juicy seekh kebab with naan', cat: 'BBQ & Grills', price: 500, discounted: 0, image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
      { title: 'Chicken Burger', desc: 'Grilled chicken breast burger with fries', cat: 'Burgers', price: 400, discounted: 350, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop' },
      { title: 'Masala Fries', desc: 'Crispy fries with special masala', cat: 'Snacks', price: 180, discounted: 0, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop' },
      { title: 'Rooh Afza', desc: 'Traditional rose sharbat', cat: 'Cold Drinks', price: 80, discounted: 0, image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop' },
    ],
  },
  {
    name: 'Lahori Dhaba',
    address: 'Bypass Road, Tando Allahyar',
    phone: '+923023456789',
    email: 'lahoridhaba@test.com',
    cuisines: ['Punjabi', 'Dhaba', 'Traditional'],
    minimumOrder: 200,
    deliveryTime: 30,
    rating: 4.6,
    reviewCount: 67,
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800&h=400&fit=crop',
    openingTimes: makeTimes('08:00', '23:00'),
    foods: [
      { title: 'Halwa Puri', desc: 'Classic breakfast halwa puri with chana', cat: 'Paratha Roll', price: 150, discounted: 0, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=300&fit=crop' },
      { title: 'Butter Chicken', desc: 'Creamy butter chicken with naan', cat: 'BBQ & Grills', price: 650, discounted: 0, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop' },
      { title: 'Daal Makhani', desc: 'Slow-cooked black lentils in butter', cat: 'Biryani', price: 350, discounted: 0, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
      { title: 'Paratha Roll', desc: 'Chicken seekh paratha roll', cat: 'Paratha Roll', price: 200, discounted: 170, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { title: 'Lassi', desc: 'Thick sweet lassi in clay glass', cat: 'Cold Drinks', price: 100, discounted: 0, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop' },
      { title: 'Gulab Jamun', desc: '2 pcs warm gulab jamun', cat: 'Desserts', price: 120, discounted: 0, image: 'https://images.unsplash.com/photo-1666190462582-4a13f7f57f36?w=400&h=300&fit=crop' },
    ],
  },
  {
    name: 'Subway shOk',
    address: 'Main Market, Tando Allahyar',
    phone: '+923034567890',
    email: 'subwayshok@test.com',
    cuisines: ['Fast Food', 'Sandwiches', 'Healthy'],
    minimumOrder: 300,
    deliveryTime: 20,
    rating: 4.1,
    reviewCount: 22,
    image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&h=400&fit=crop',
    openingTimes: makeTimes('10:00', '22:00'),
    foods: [
      { title: 'Chicken Tikka Sub', desc: '12 inch sub with chicken tikka', cat: 'Burgers', price: 550, discounted: 0, image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&h=300&fit=crop' },
      { title: 'Veggie Delight Sub', desc: 'Fresh veggies and cheese sub', cat: 'Burgers', price: 450, discounted: 0, image: 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&h=300&fit=crop' },
      { title: 'Chicken Nuggets', desc: '8 pcs crispy chicken nuggets', cat: 'Snacks', price: 350, discounted: 300, image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=300&fit=crop' },
      { title: 'Caesar Salad', desc: 'Grilled chicken caesar salad', cat: 'Snacks', price: 400, discounted: 0, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop' },
      { title: 'Coke Zero', desc: 'Chilled Coke Zero 500ml', cat: 'Cold Drinks', price: 80, discounted: 0, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=300&fit=crop' },
    ],
  },
  {
    name: 'Hyderabadi Biryani Point',
    address: 'GT Road, Tando Allahyar',
    phone: '+923045678901',
    email: 'hyderabadibp@test.com',
    cuisines: ['Hyderabadi', 'Biryani', 'Haleem'],
    minimumOrder: 200,
    deliveryTime: 40,
    rating: 4.7,
    reviewCount: 89,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=400&fit=crop',
    openingTimes: makeTimes('11:00', '23:30'),
    foods: [
      { title: 'Special Biryani', desc: 'Hyderabadi dum biryani with raita', cat: 'Biryani', price: 500, discounted: 0, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop' },
      { title: 'Mutton Biryani', desc: 'Tender mutton with saffron rice', cat: 'Biryani', price: 700, discounted: 0, image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&h=300&fit=crop' },
      { title: 'Haleem', desc: 'Slow-cooked wheat and meat haleem', cat: 'Biryani', price: 300, discounted: 0, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop' },
      { title: 'Chicken 65', desc: 'Spicy deep-fried chicken pieces', cat: 'Snacks', price: 350, discounted: 0, image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=300&fit=crop' },
      { title: 'Double Ka Meetha', desc: 'Traditional bread pudding dessert', cat: 'Desserts', price: 150, discounted: 0, image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop' },
      { title: 'Mirchi Ka Salan', desc: 'Spicy chili curry side', cat: 'BBQ & Grills', price: 120, discounted: 0, image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop' },
    ],
  },
  {
    name: 'Pizza Town',
    address: 'College Road, Tando Allahyar',
    phone: '+923056789012',
    email: 'pizzatown@test.com',
    cuisines: ['Italian', 'Pizza', 'Pasta'],
    minimumOrder: 350,
    deliveryTime: 25,
    rating: 4.0,
    reviewCount: 33,
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=400&fit=crop',
    openingTimes: makeTimes('12:00', '00:00'),
    foods: [
      { title: 'Pepperoni Pizza', desc: 'Classic pepperoni with mozzarella', cat: 'Pizza', price: 900, discounted: 0, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop' },
      { title: 'Chicken Fajita Pizza', desc: 'Spiced chicken fajita toppings', cat: 'Pizza', price: 850, discounted: 0, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop' },
      { title: 'Veggie Supreme Pizza', desc: 'Loaded with fresh vegetables', cat: 'Pizza', price: 750, discounted: 700, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop' },
      { title: 'Garlic Bread', desc: 'Cheesy garlic bread sticks', cat: 'Snacks', price: 250, discounted: 0, image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=400&h=300&fit=crop' },
      { title: 'Pasta Alfredo', desc: 'Creamy white sauce pasta', cat: 'Biryani', price: 500, discounted: 0, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop' },
      { title: 'Oreo Shake', desc: 'Thick Oreo milkshake', cat: 'Desserts', price: 200, discounted: 0, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop' },
    ],
  },
  {
    name: 'Chai Wala Corner',
    address: 'Hospital Road, Tando Allahyar',
    phone: '+923067890123',
    email: 'chaiwala@test.com',
    cuisines: ['Tea', 'Snacks', 'Street Food'],
    minimumOrder: 100,
    deliveryTime: 15,
    rating: 4.8,
    reviewCount: 112,
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=400&fit=crop',
    openingTimes: makeTimes('06:00', '01:00'),
    foods: [
      { title: 'Kashmiri Chai', desc: 'Pink salted Kashmiri chai', cat: 'Cold Drinks', price: 80, discounted: 0, image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6201f?w=400&h=300&fit=crop' },
      { title: 'Doodh Patti', desc: 'Strong milk tea', cat: 'Cold Drinks', price: 60, discounted: 0, image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop' },
      { title: 'Samosa', desc: '2 pcs crispy chicken samosa', cat: 'Snacks', price: 80, discounted: 0, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop' },
      { title: 'Pakora', desc: 'Mixed vegetable pakora plate', cat: 'Snacks', price: 120, discounted: 0, image: 'https://images.unsplash.com/photo-1625398407796-82650a8c135e?w=400&h=300&fit=crop' },
      { title: 'Naan Khatai', desc: '4 pcs homemade cookies', cat: 'Desserts', price: 100, discounted: 0, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop' },
    ],
  },
  {
    name: 'BBQ Tonight',
    address: 'Sindh Highway, Tando Allahyar',
    phone: '+923078901234',
    email: 'bbqtonight@test.com',
    cuisines: ['BBQ', 'Family', 'Dine-in'],
    minimumOrder: 400,
    deliveryTime: 45,
    rating: 4.4,
    reviewCount: 56,
    image: 'https://images.unsplash.com/photo-1529006557810-274b9b3fc259?w=800&h=400&fit=crop',
    openingTimes: makeTimes('17:00', '01:00'),
    foods: [
      { title: 'Family BBQ Platter', desc: 'Mixed grill for 4 persons', cat: 'BBQ & Grills', price: 2500, discounted: 0, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop' },
      { title: 'Reshmi Kebab', desc: '8 pcs creamy reshmi kebab', cat: 'BBQ & Grills', price: 800, discounted: 0, image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
      { title: 'Tandoori Chicken', desc: 'Half tandoori chicken with naan', cat: 'BBQ & Grills', price: 600, discounted: 0, image: 'https://images.unsplash.com/photo-1610057099144-6c1463e2e117?w=400&h=300&fit=crop' },
      { title: 'Chapli Kebab', desc: '2 pcs Peshawari chapli kebab', cat: 'BBQ & Grills', price: 400, discounted: 0, image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop' },
      { title: 'Afghan Bread', desc: 'Fresh baked naan', cat: 'Paratha Roll', price: 40, discounted: 0, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop' },
      { title: 'Kala Khatta', desc: 'Icy grape sherbet', cat: 'Cold Drinks', price: 60, discounted: 0, image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop' },
    ],
  },
];

async function seedShadow() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const vendor = await User.findOne({ email: 'vendor@test.com' });
  if (!vendor) {
    console.error('vendor@test.com not found. Run seed.js first.');
    process.exit(1);
  }

  const catMap = {};
  (await Category.find({})).forEach(c => { catMap[c.title] = c._id; });

  // Clear shadow restaurants only (owned by vendor, not in original seed list)
  const KEEP_NAMES = ['Shah Biryani House', 'Khan BBQ Corner', 'Green Valley Fast Food'];
  const shadowNames = SHADOW_RESTAURANTS.map(r => r.name);
  await Restaurant.deleteMany({ owner: vendor._id, name: { $nin: KEEP_NAMES } });
  await Food.deleteMany({ restaurant: { $nin: (await Restaurant.find({ name: { $in: KEEP_NAMES } })).map(r => r._id) } });
  await Variation.deleteMany({});

  let totalFoods = 0;
  let totalVariations = 0;

  for (const data of SHADOW_RESTAURANTS) {
    const lat = jitter(LAT, 0.008);
    const lng = jitter(LNG, 0.008);

    const restaurant = await Restaurant.create({
      name: data.name,
      image: data.image,
      address: data.address,
      phone: data.phone,
      email: data.email,
      owner: vendor._id,
      shopType: 'restaurant',
      cuisines: data.cuisines,
      location: { type: 'Point', coordinates: [lng, lat] },
      minimumOrder: data.minimumOrder,
      deliveryTime: data.deliveryTime,
      tax: 5,
      rating: data.rating,
      reviewCount: data.reviewCount,
      commissionRate: 10,
      openingTimes: data.openingTimes,
    });

    const variationDocs = data.foods.map(f => ({
      title: 'Regular',
      price: f.price,
      discounted: f.discounted,
    }));
    const variations = await Variation.insertMany(variationDocs);
    totalVariations += variations.length;

    const foodDocs = data.foods.map((f, i) => ({
      title: f.title,
      description: f.desc,
      image: f.image || null,
      restaurant: restaurant._id,
      category: catMap[f.cat] || catMap['Snacks'],
      variations: [variations[i]._id],
      isOutOfStock: Math.random() < 0.08,
    }));
    await Food.insertMany(foodDocs);
    totalFoods += foodDocs.length;

    console.log(`  ${data.name} — ${data.foods.length} foods`);
  }

  console.log(`\n--- SHADOW SEED COMPLETE ---`);
  console.log(`Restaurants: ${SHADOW_RESTAURANTS.length}`);
  console.log(`Food items: ${totalFoods}`);
  console.log(`Variations: ${totalVariations}`);

  await mongoose.disconnect();
  console.log('Done.');
}

seedShadow().catch(err => {
  console.error('Shadow seed error:', err);
  process.exit(1);
});
