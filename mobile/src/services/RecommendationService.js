import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'userSession';
const GUEST_SESSION_KEY = 'guestSession';

// Initialize session
export const initializeSession = async (userId = null) => {
  const key = userId ? `${SESSION_KEY}_${userId}` : GUEST_SESSION_KEY;
  const existing = await AsyncStorage.getItem(key);
  
  if (existing) return JSON.parse(existing);
  
  const session = {
    sessionId: Date.now().toString(),
    userId: userId,
    isGuest: !userId,
    startTime: new Date().toISOString(),
    viewedProducts: [],
    viewedCategories: [],
    cartItems: [],
    categoryPreferences: {},
    searches: [],
  };
  
  await AsyncStorage.setItem(key, JSON.stringify(session));
  return session;
};

// Get current session
export const getSessionData = async (userId = null) => {
  const key = userId ? `${SESSION_KEY}_${userId}` : GUEST_SESSION_KEY;
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : await initializeSession(userId);
};

// Save session
export const saveSessionData = async (session) => {
  const key = session.userId ? `${SESSION_KEY}_${session.userId}` : GUEST_SESSION_KEY;
  await AsyncStorage.setItem(key, JSON.stringify(session));
};

// Track product view
export const trackProductView = async (productId, categoryId, userId = null) => {
  const session = await getSessionData(userId);
  
  session.viewedProducts.push({
    productId,
    categoryId,
    timestamp: new Date().toISOString(),
    timeSpent: 0,
  });
  
  await trackCategoryView(categoryId, userId);
  await saveSessionData(session);
};

// Track category view
export const trackCategoryView = async (categoryId, userId = null) => {
  const session = await getSessionData(userId);
  
  const catIndex = session.viewedCategories.findIndex(c => c.categoryId === categoryId);
  if (catIndex >= 0) {
    session.viewedCategories[catIndex].count++;
    session.viewedCategories[catIndex].lastVisit = new Date().toISOString();
  } else {
    session.viewedCategories.push({
      categoryId,
      count: 1,
      lastVisit: new Date().toISOString(),
    });
  }
  
  updateCategoryPreferences(session);
  await saveSessionData(session);
};

// Update category preferences
const updateCategoryPreferences = (session) => {
  const total = session.viewedCategories.reduce((sum, cat) => sum + cat.count, 0);
  session.categoryPreferences = {};
  
  session.viewedCategories.forEach(cat => {
    session.categoryPreferences[cat.categoryId] = cat.count / total;
  });
};

// Track add to cart
export const trackAddToCart = async (productId, categoryId, userId = null) => {
  const session = await getSessionData(userId);
  
  // Increase category preference
  const catPref = session.categoryPreferences[categoryId] || 0;
  session.categoryPreferences[categoryId] = Math.min(catPref + 0.1, 1);
  
  await saveSessionData(session);
};

// Get category products with smart limit
export const getCategoryProducts = async (categoryId, allProducts, userId = null) => {
  const session = await getSessionData(userId);
  
  // Filter by category
  const categoryProducts = allProducts.filter(p => 
    (p.category?._id || p.category) === categoryId
  );
  
  // Get viewed products in this category
  const viewedInCategory = session.viewedProducts
    .filter(v => v.categoryId === categoryId)
    .map(v => v.productId);
  
  // Separate viewed and not viewed
  const notViewed = categoryProducts.filter(p => !viewedInCategory.includes(p._id));
  const viewed = categoryProducts.filter(p => viewedInCategory.includes(p._id));
  
  // Calculate display limit based on visits
  const categoryVisits = session.viewedCategories.find(c => c.categoryId === categoryId);
  const visitCount = categoryVisits?.count || 0;
  
  // More visits = show more products (20 base + 5 per visit, max 50)
  const displayLimit = Math.min(20 + (visitCount * 5), 50);
  
  // Shuffle and combine: new products first
  const shuffleArray = (arr) => arr.sort(() => 0.5 - Math.random());
  return [...shuffleArray(notViewed), ...shuffleArray(viewed)].slice(0, displayLimit);
};

// Get recommended products (not used on home page)
export const getRecommendedProducts = async (allProducts, userId = null) => {
  const session = await getSessionData(userId);
  const preferences = session.categoryPreferences || {};
  
  if (Object.keys(preferences).length === 0) {
    // No preferences yet, return diverse selection
    return getDiverseProducts(allProducts, 20);
  }
  
  // Score products based on preferences
  const scoredProducts = allProducts.map(product => {
    let score = 0;
    const catId = product.category?._id || product.category;
    
    // Category preference (40%)
    score += (preferences[catId] || 0) * 0.4;
    
    // Not viewed bonus (30%)
    const isViewed = session.viewedProducts.find(v => v.productId === product._id);
    if (!isViewed) score += 0.3;
    
    // Similar to cart (20%)
    const inCart = session.cartItems?.find(c => c.categoryId === catId);
    if (inCart) score += 0.2;
    
    // Random factor (10%)
    score += Math.random() * 0.1;
    
    return { product, score };
  });
  
  return scoredProducts
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(item => item.product);
};

// Get diverse products (2 from each category)
const getDiverseProducts = (allProducts, limit) => {
  const byCategory = {};
  
  allProducts.forEach(product => {
    const catId = product.category?._id || product.category;
    if (!byCategory[catId]) byCategory[catId] = [];
    byCategory[catId].push(product);
  });
  
  const diverse = [];
  Object.values(byCategory).forEach(products => {
    const shuffled = products.sort(() => 0.5 - Math.random());
    diverse.push(...shuffled.slice(0, 2));
  });
  
  return diverse.sort(() => 0.5 - Math.random()).slice(0, limit);
};

// Merge guest session to user session
export const mergeGuestToUserSession = async (userId) => {
  const guestData = await AsyncStorage.getItem(GUEST_SESSION_KEY);
  if (!guestData) return;
  
  const guest = JSON.parse(guestData);
  const userData = await getSessionData(userId);
  
  // Merge viewed products
  userData.viewedProducts = [...userData.viewedProducts, ...guest.viewedProducts];
  
  // Merge viewed categories
  guest.viewedCategories.forEach(guestCat => {
    const index = userData.viewedCategories.findIndex(c => c.categoryId === guestCat.categoryId);
    if (index >= 0) {
      userData.viewedCategories[index].count += guestCat.count;
    } else {
      userData.viewedCategories.push(guestCat);
    }
  });
  
  // Merge cart items
  userData.cartItems = [...userData.cartItems, ...guest.cartItems];
  
  // Recalculate preferences
  updateCategoryPreferences(userData);
  
  await saveSessionData(userData);
  await AsyncStorage.removeItem(GUEST_SESSION_KEY);
};

// Get category visit count
export const getCategoryVisitCount = async (categoryId, userId = null) => {
  const session = await getSessionData(userId);
  const category = session.viewedCategories.find(c => c.categoryId === categoryId);
  return category?.count || 0;
};

// Check if login required
export const requiresLogin = (action) => {
  const loginRequired = [
    'checkout',
    'placeOrder',
    'saveFavorite',
    'viewOrders',
    'trackOrder',
    'writeReview',
    'saveAddress',
  ];
  return loginRequired.includes(action);
};

export default {
  initializeSession,
  getSessionData,
  trackProductView,
  trackCategoryView,
  trackAddToCart,
  getCategoryProducts,
  getRecommendedProducts,
  mergeGuestToUserSession,
  getCategoryVisitCount,
  requiresLogin,
};
