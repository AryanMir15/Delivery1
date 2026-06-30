require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Category = require('./models/Category');
const Restaurant = require('./models/Restaurant');
const Food = require('./models/Food');
const Variation = require('./models/Variation');
const Addon = require('./models/Addon');
const Order = require('./models/Order');
const Wallet = require('./models/Wallet');
const Zone = require('./models/Zone');

// Tando Allahyar coordinates
const LAT = 25.7714;
const LNG = 68.6684;

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // --- Find existing users ---
  const customer = await User.findOne({ email: 'tanzil@test.com' });
  const rider = await User.findOne({ email: 'rider@test.com' });
  const vendor = await User.findOne({ email: 'vendor@test.com' });

  if (!customer || !rider || !vendor) {
    console.error('Missing test users! Create them first.');
    process.exit(1);
  }
  console.log(`Customer: ${customer._id}`);
  console.log(`Rider: ${rider._id}`);
  console.log(`Vendor: ${vendor._id}`);

  // --- Categories ---
  await Category.deleteMany({});
  const categories = await Category.insertMany([
    { title: 'Burgers', description: 'Juicy grilled burgers', businessType: 'restaurant', sortOrder: 1 },
    { title: 'Pizza', description: 'Wood-fired pizzas', businessType: 'restaurant', sortOrder: 2 },
    { title: 'Biryani', description: 'Aromatic rice dishes', businessType: 'restaurant', sortOrder: 3 },
    { title: 'BBQ & Grills', description: 'Charcoal grilled meats', businessType: 'restaurant', sortOrder: 4 },
    { title: 'Paratha Roll', description: 'Flaky paratha wraps', businessType: 'restaurant', sortOrder: 5 },
    { title: 'Snacks', description: 'Fries, nuggets, and more', businessType: 'restaurant', sortOrder: 6 },
    { title: 'Cold Drinks', description: 'Refreshing beverages', businessType: 'restaurant', sortOrder: 7 },
    { title: 'Desserts', description: 'Sweet treats', businessType: 'restaurant', sortOrder: 8 },
  ]);
  console.log(`Created ${categories.length} categories`);

  const catMap = {};
  categories.forEach(c => { catMap[c.title] = c._id; });

  // --- Addons ---
  const addons = await Addon.insertMany([
    {
      title: 'Extra Cheese',
      options: [{ title: 'Cheddar', price: 50 }, { title: 'Mozzarella', price: 60 }],
    },
    {
      title: 'Sauces',
      options: [{ title: 'Ketchup', price: 10 }, { title: 'Mayo', price: 10 }, { title: 'Hot Sauce', price: 15 }],
    },
  ]);
  console.log(`Created ${addons.length} addons`);

  // --- Zone ---
  const existingZone = await Zone.findOne({ title: 'Tando Allahyar City' });
  if (!existingZone) {
    await Zone.create({
      title: 'Tando Allahyar City',
      description: 'Main city delivery zone',
      boundaries: {
        type: 'Polygon',
        coordinates: [[[LNG - 0.05, LAT - 0.05], [LNG + 0.05, LAT - 0.05], [LNG + 0.05, LAT + 0.05], [LNG - 0.05, LAT + 0.05], [LNG - 0.05, LAT - 0.05]]],
      },
      location: { type: 'Point', coordinates: [LNG, LAT] },
      tax: 5,
      deliveryCharges: 50,
      baseDeliveryFee: 30,
      feePerKm: 15,
    });
    console.log('Created Tando Allahyar zone');
  }

  // --- Restaurants (insert one at a time so slug auto-generates) ---
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const makeTimes = (start, end) => days.map(day => ({ day, times: [{ startTime: start, endTime: end }] }));

  // Clear old vendor restaurants first (includes orphaned ones from failed runs)
  await Restaurant.deleteMany({ owner: vendor._id });
  await Food.deleteMany({});
  await Variation.deleteMany({});
  await Addon.deleteMany({});
  await Order.deleteMany({});
  await Zone.deleteMany({});
  await Wallet.deleteMany({ user: { $in: [customer._id, rider._id, vendor._id] } });

  const shahBiryani = await Restaurant.create({
    name: 'Shah Biryani House',
    address: 'Main Bazaar, Tando Allahyar',
    phone: '+923001234567',
    email: 'shahbiryani@test.com',
    owner: vendor._id,
    shopType: 'restaurant',
    cuisines: ['Pakistani', 'Biryani'],
    location: { type: 'Point', coordinates: [LNG + 0.002, LAT + 0.001] },
    minimumOrder: 200, deliveryTime: 30, tax: 5, rating: 4.5, reviewCount: 23, commissionRate: 10,
    openingTimes: makeTimes('10:00', '23:00'),
  });
  console.log('Created Shah Biryani House');

  const khanBBQ = await Restaurant.create({
    name: 'Khan BBQ Corner',
    address: 'Sindh Road, Tando Allahyar',
    phone: '+923007654321',
    email: 'khanbbq@test.com',
    owner: vendor._id,
    shopType: 'restaurant',
    cuisines: ['BBQ', 'Grilled'],
    location: { type: 'Point', coordinates: [LNG - 0.001, LAT + 0.002] },
    minimumOrder: 300, deliveryTime: 40, tax: 5, rating: 4.2, reviewCount: 15, commissionRate: 10,
    openingTimes: makeTimes('12:00', '00:00'),
  });
  console.log('Created Khan BBQ Corner');

  const greenValley = await Restaurant.create({
    name: 'Green Valley Fast Food',
    address: 'Hospital Road, Tando Allahyar',
    phone: '+923009876543',
    email: 'greenvalley@test.com',
    owner: vendor._id,
    shopType: 'restaurant',
    cuisines: ['Fast Food', 'Chinese'],
    location: { type: 'Point', coordinates: [LNG + 0.001, LAT - 0.001] },
    minimumOrder: 150, deliveryTime: 25, tax: 5, rating: 3.9, reviewCount: 8, commissionRate: 10,
    openingTimes: makeTimes('11:00', '23:00'),
  });
  console.log('Created Green Valley Fast Food');

  const restaurants = [shahBiryani, khanBBQ, greenValley];

  // --- Foods ---
  const foodsData = [
    // Shah Biryani House
    { title: 'Chicken Biryani', description: 'Classic hyderabadi chicken biryani', restaurant: shahBiryani._id, category: catMap['Biryani'], isOutOfStock: false },
    { title: 'Mutton Biryani', description: 'Tender mutton pieces with fragrant rice', restaurant: shahBiryani._id, category: catMap['Biryani'], isOutOfStock: false },
    { title: 'Seekh Kebab Platter', description: '6 pcs seekh kebab with naan', restaurant: shahBiryani._id, category: catMap['BBQ & Grills'], isOutOfStock: false },
    { title: 'Chicken Karahi', description: 'Spicy chicken karahi with naan', restaurant: shahBiryani._id, category: catMap['BBQ & Grills'], isOutOfStock: true },

    // Khan BBQ Corner
    { title: 'Tikka Platter', description: 'Mix tikka platter with raita', restaurant: khanBBQ._id, category: catMap['BBQ & Grills'], isOutOfStock: false },
    { title: 'Reshmi Kebab', description: 'Creamy grilled chicken kebab', restaurant: khanBBQ._id, category: catMap['BBQ & Grills'], isOutOfStock: false },
    { title: 'BBQ Paratha Roll', description: 'Chicken tikka in paratha', restaurant: khanBBQ._id, category: catMap['Paratha Roll'], isOutOfStock: false },
    { title: 'Platter Special', description: 'Family size BBQ platter for 4', restaurant: khanBBQ._id, category: catMap['BBQ & Grills'], isOutOfStock: false },

    // Green Valley Fast Food
    { title: 'Zinger Burger', description: 'Crispy chicken zinger burger', restaurant: greenValley._id, category: catMap['Burgers'], isOutOfStock: false },
    { title: 'Cheese Burger', description: 'Double patty cheese burger', restaurant: greenValley._id, category: catMap['Burgers'], isOutOfStock: false },
    { title: 'Chicken Pizza', description: '12 inch chicken supreme pizza', restaurant: greenValley._id, category: catMap['Pizza'], isOutOfStock: false },
    { title: 'Fries Large', description: 'Crispy golden fries with ketchup', restaurant: greenValley._id, category: catMap['Snacks'], isOutOfStock: false },
    { title: 'Cold Drink 1.5L', description: 'Pepsi or Coke', restaurant: greenValley._id, category: catMap['Cold Drinks'], isOutOfStock: false },
  ];

  const foods = await Food.insertMany(foodsData);
  console.log(`Created ${foods.length} food items`);

  // --- Variations (per food item) ---
  const variationsData = [];
  for (const food of foods) {
    if (food.title.includes('Biryani') || food.title.includes('Karahi') || food.title.includes('Pizza')) {
      variationsData.push(
        { title: 'Regular', price: food.title.includes('Pizza') ? 850 : 450, discounted: 0 },
        { title: 'Family', price: food.title.includes('Pizza') ? 1500 : 800, discounted: 0 },
      );
    } else if (food.title.includes('Roll')) {
      variationsData.push(
        { title: 'Single', price: 180, discounted: 150 },
        { title: 'Double', price: 280, discounted: 0 },
      );
    } else if (food.title.includes('Burger') || food.title.includes('Zinger')) {
      variationsData.push(
        { title: 'Regular', price: 350, discounted: 0 },
        { title: 'Combo (with Fries + Drink)', price: 550, discounted: 500 },
      );
    } else if (food.title.includes('Drink')) {
      variationsData.push({ title: '1.5L', price: 120, discounted: 0 });
    } else if (food.title.includes('Fries')) {
      variationsData.push({ title: 'Large', price: 200, discounted: 180 });
    } else if (food.title.includes('Platter') || food.title.includes('Kebab')) {
      variationsData.push(
        { title: 'Half', price: 600, discounted: 0 },
        { title: 'Full', price: 1100, discounted: 0 },
      );
    } else {
      variationsData.push({ title: 'Regular', price: 300, discounted: 0 });
    }
  }

  const variations = await Variation.insertMany(variationsData);
  console.log(`Created ${variations.length} variations`);

  // Link variations to foods
  let vIdx = 0;
  for (const food of foods) {
    if (food.title.includes('Biryani') || food.title.includes('Karahi') || food.title.includes('Pizza')) {
      await Food.findByIdAndUpdate(food._id, { variations: [variations[vIdx]._id, variations[vIdx + 1]._id] });
      vIdx += 2;
    } else if (food.title.includes('Roll') || food.title.includes('Burger') || food.title.includes('Zinger') ||
               food.title.includes('Platter') || food.title.includes('Kebab')) {
      const count = (food.title.includes('Roll') || food.title.includes('Burger') || food.title.includes('Zinger') ||
                     food.title.includes('Platter') || food.title.includes('Kebab')) ? 2 : 1;
      await Food.findByIdAndUpdate(food._id, { variations: variations.slice(vIdx, vIdx + count).map(v => v._id) });
      vIdx += count;
    } else {
      await Food.findByIdAndUpdate(food._id, { variations: [variations[vIdx]._id] });
      vIdx += 1;
    }
  }
  console.log('Linked variations to foods');

  // --- Orders ---
  const now = new Date();
  const ordersData = [
    // Pending order (no rider yet)
    {
      user: customer._id,
      restaurant: shahBiryani._id,
      items: [
        { food: foods[0]._id, title: 'Chicken Biryani', quantity: 2, variation: { title: 'Regular', price: 450 } },
        { food: foods[2]._id, title: 'Seekh Kebab Platter', quantity: 1, variation: { title: 'Half', price: 600 } },
      ],
      orderStatus: 'pending',
      orderAmount: 1500,
      deliveryCharges: 50,
      taxationAmount: 75,
      tipping: 0,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      deliveryAddress: {
        deliveryAddress: 'House 123, Satellite Town, Tando Allahyar',
        details: 'Near the mosque',
        location: { type: 'Point', coordinates: [LNG - 0.003, LAT - 0.002] },
      },
      orderDate: new Date(now - 1000 * 60 * 5),
    },
    // Pending order (no rider yet)
    {
      user: customer._id,
      restaurant: greenValley._id,
      items: [
        { food: foods[8]._id, title: 'Zinger Burger', quantity: 1, variation: { title: 'Combo (with Fries + Drink)', price: 550 } },
        { food: foods[11]._id, title: 'Fries Large', quantity: 2, variation: { title: 'Large', price: 180 } },
        { food: foods[12]._id, title: 'Cold Drink 1.5L', quantity: 1, variation: { title: '1.5L', price: 120 } },
      ],
      orderStatus: 'pending',
      orderAmount: 1030,
      deliveryCharges: 40,
      taxationAmount: 51,
      tipping: 30,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      deliveryAddress: {
        deliveryAddress: 'Plot 45, Main Road, Tando Allahyar',
        details: 'Next to pharmacy',
        location: { type: 'Point', coordinates: [LNG + 0.001, LAT + 0.003] },
      },
      orderDate: new Date(now - 1000 * 60 * 2),
    },
    // Accepted by rider (active delivery)
    {
      user: customer._id,
      restaurant: khanBBQ._id,
      rider: rider._id,
      items: [
        { food: foods[4]._id, title: 'Tikka Platter', quantity: 1, variation: { title: 'Full', price: 1100 } },
        { food: foods[6]._id, title: 'BBQ Paratha Roll', quantity: 3, variation: { title: 'Double', price: 280 } },
      ],
      orderStatus: 'accepted',
      orderAmount: 1940,
      deliveryCharges: 60,
      taxationAmount: 97,
      tipping: 50,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      deliveryAddress: {
        deliveryAddress: 'Village Kario, near bypass, Tando Allahyar',
        details: 'Blue gate house',
        location: { type: 'Point', coordinates: [LNG + 0.004, LAT - 0.001] },
      },
      orderDate: new Date(now - 1000 * 60 * 20),
      acceptedAt: new Date(now - 1000 * 60 * 15),
      assignedAt: new Date(now - 1000 * 60 * 18),
    },
    // Delivered (completed)
    {
      user: customer._id,
      restaurant: shahBiryani._id,
      rider: rider._id,
      items: [
        { food: foods[0]._id, title: 'Chicken Biryani', quantity: 1, variation: { title: 'Family', price: 800 } },
      ],
      orderStatus: 'delivered',
      orderAmount: 800,
      deliveryCharges: 50,
      taxationAmount: 40,
      tipping: 20,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      deliveryAddress: {
        deliveryAddress: 'House 123, Satellite Town, Tando Allahyar',
        details: 'Near the mosque',
        location: { type: 'Point', coordinates: [LNG - 0.003, LAT - 0.002] },
      },
      orderDate: new Date(now - 1000 * 60 * 60 * 24),
      acceptedAt: new Date(now - 1000 * 60 * 60 * 24 + 1000 * 60 * 5),
      deliveredAt: new Date(now - 1000 * 60 * 60 * 24 + 1000 * 60 * 35),
    },
    // Delivered (completed)
    {
      user: customer._id,
      restaurant: greenValley._id,
      rider: rider._id,
      items: [
        { food: foods[9]._id, title: 'Cheese Burger', quantity: 2, variation: { title: 'Regular', price: 350 } },
        { food: foods[10]._id, title: 'Chicken Pizza', quantity: 1, variation: { title: 'Regular', price: 850 } },
      ],
      orderStatus: 'delivered',
      orderAmount: 1550,
      deliveryCharges: 40,
      taxationAmount: 77,
      tipping: 0,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      deliveryAddress: {
        deliveryAddress: 'School Road, Tando Allahyar',
        details: 'Opposite Govt. Boys School',
        location: { type: 'Point', coordinates: [LNG, LAT + 0.001] },
      },
      orderDate: new Date(now - 1000 * 60 * 60 * 48),
      acceptedAt: new Date(now - 1000 * 60 * 60 * 48 + 1000 * 60 * 3),
      deliveredAt: new Date(now - 1000 * 60 * 60 * 48 + 1000 * 60 * 30),
    },
    // Preparing order
    {
      user: customer._id,
      restaurant: shahBiryani._id,
      items: [
        { food: foods[1]._id, title: 'Mutton Biryani', quantity: 1, variation: { title: 'Regular', price: 450 } },
        { food: foods[3]._id, title: 'Chicken Karahi', quantity: 1, variation: { title: 'Regular', price: 450 } },
      ],
      orderStatus: 'preparing',
      orderAmount: 900,
      deliveryCharges: 50,
      taxationAmount: 45,
      tipping: 0,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      deliveryAddress: {
        deliveryAddress: 'Market Area, Tando Allahyar',
        details: 'Near SBP branch',
        location: { type: 'Point', coordinates: [LNG - 0.001, LAT + 0.001] },
      },
      orderDate: new Date(now - 1000 * 60 * 12),
    },
  ];

  const orders = [];
  for (const orderData of ordersData) {
    const order = await Order.create(orderData);
    orders.push(order);
  }
  console.log(`Created ${orders.length} orders`);

  // --- Wallets ---
  await Wallet.create({ user: rider._id, balance: 850, currency: 'PKR' });
  console.log('Created rider wallet (PKR 850)');

  await Wallet.create({ user: vendor._id, balance: 12500, currency: 'PKR' });
  console.log('Created vendor wallet (PKR 12,500)');

  // --- Print summary ---
  console.log('\n--- SEED COMPLETE ---');
  console.log(`Restaurants: ${restaurants.length}`);
  console.log(`Food items: ${foods.length}`);
  console.log(`Categories: ${categories.length}`);
  console.log(`Orders: ${orders.length} (2 pending, 1 accepted, 2 delivered, 1 preparing)`);
  console.log(`Rider wallet: PKR 850`);
  console.log(`Vendor wallet: PKR 12,500`);

  await mongoose.disconnect();
  console.log('Done.');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
