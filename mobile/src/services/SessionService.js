import AsyncStorage from '@react-native-async-storage/async-storage';

class SessionService {
  constructor() {
    this.SESSION_KEY = 'guestSession';
    this.USER_SESSION_PREFIX = 'userSession_';
  }

  // Generate simple UUID
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Initialize guest session
  async initializeGuestSession() {
    try {
      const existing = await AsyncStorage.getItem(this.SESSION_KEY);
      if (existing) return JSON.parse(existing);

      const session = {
        sessionId: this.generateUUID(),
        startTime: new Date().toISOString(),
        isGuest: true,
        viewedProducts: [],
        viewedCategories: [],
        cartItems: [],
        clicks: [],
        searches: [],
        categoryPreferences: {}
      };

      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      return session;
    } catch (error) {
      console.error('Error initializing guest session:', error);
      return null;
    }
  }

  // Load user session
  async loadUserSession(userId) {
    try {
      const key = `${this.USER_SESSION_PREFIX}${userId}`;
      const existing = await AsyncStorage.getItem(key);
      
      if (existing) return JSON.parse(existing);

      const session = {
        userId,
        sessionId: this.generateUUID(),
        startTime: new Date().toISOString(),
        isGuest: false,
        viewedProducts: [],
        viewedCategories: [],
        cartItems: [],
        clicks: [],
        searches: [],
        favorites: [],
        purchaseHistory: [],
        categoryPreferences: {},
        lastRecommendationUpdate: null,
        recommendedProducts: []
      };

      await AsyncStorage.setItem(key, JSON.stringify(session));
      return session;
    } catch (error) {
      console.error('Error loading user session:', error);
      return null;
    }
  }

  // Get current session data
  async getSessionData(userId = null) {
    try {
      const key = userId ? `${this.USER_SESSION_PREFIX}${userId}` : this.SESSION_KEY;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting session data:', error);
      return null;
    }
  }

  // Save session data
  async saveSessionData(session, userId = null) {
    try {
      const key = userId ? `${this.USER_SESSION_PREFIX}${userId}` : this.SESSION_KEY;
      await AsyncStorage.setItem(key, JSON.stringify(session));
      return true;
    } catch (error) {
      console.error('Error saving session data:', error);
      return false;
    }
  }

  // Track product view
  async trackProductView(productId, categoryId, userId = null) {
    try {
      let session = await this.getSessionData(userId);
      
      // Initialize session if it doesn't exist
      if (!session) {
        session = userId ? await this.loadUserSession(userId) : await this.initializeGuestSession();
      }
      
      if (!session) return;

      // Ensure arrays exist
      if (!session.viewedProducts) session.viewedProducts = [];
      if (!session.viewedCategories) session.viewedCategories = [];

      session.viewedProducts.push({
        productId,
        categoryId,
        timestamp: new Date().toISOString(),
        timeSpent: 0
      });

      // Update category count
      const catIndex = session.viewedCategories.findIndex(c => c.categoryId === categoryId);
      if (catIndex >= 0) {
        session.viewedCategories[catIndex].count++;
        session.viewedCategories[catIndex].lastVisit = new Date().toISOString();
      } else {
        session.viewedCategories.push({
          categoryId,
          count: 1,
          lastVisit: new Date().toISOString()
        });
      }

      this.updateCategoryPreferences(session);
      await this.saveSessionData(session, userId);
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }

  // Update product view time
  async updateProductViewTime(productId, timeSpent, userId = null) {
    try {
      const session = await this.getSessionData(userId);
      if (!session || !session.viewedProducts) return;

      const view = session.viewedProducts.find(v => v.productId === productId);
      if (view) {
        view.timeSpent = timeSpent;
        await this.saveSessionData(session, userId);
      }
    } catch (error) {
      console.error('Error updating view time:', error);
    }
  }

  // Track category view
  async trackCategoryView(categoryId, userId = null) {
    try {
      let session = await this.getSessionData(userId);
      
      // Initialize session if it doesn't exist
      if (!session) {
        session = userId ? await this.loadUserSession(userId) : await this.initializeGuestSession();
      }
      
      if (!session) return;

      // Ensure array exists
      if (!session.viewedCategories) session.viewedCategories = [];

      const catIndex = session.viewedCategories.findIndex(c => c.categoryId === categoryId);
      if (catIndex >= 0) {
        session.viewedCategories[catIndex].count++;
        session.viewedCategories[catIndex].lastVisit = new Date().toISOString();
      } else {
        session.viewedCategories.push({
          categoryId,
          count: 1,
          lastVisit: new Date().toISOString()
        });
      }

      this.updateCategoryPreferences(session);
      await this.saveSessionData(session, userId);
    } catch (error) {
      console.error('Error tracking category view:', error);
    }
  }

  // Track add to cart
  async trackAddToCart(productId, categoryId, quantity, userId = null) {
    try {
      const session = await this.getSessionData(userId);
      if (!session) return;

      session.cartItems.push({
        productId,
        categoryId,
        quantity,
        addedAt: new Date().toISOString()
      });

      // Increase category preference
      if (session.categoryPreferences[categoryId]) {
        session.categoryPreferences[categoryId] += 0.1;
      } else {
        session.categoryPreferences[categoryId] = 0.1;
      }

      await this.saveSessionData(session, userId);
    } catch (error) {
      console.error('Error tracking add to cart:', error);
    }
  }

  // Track search
  async trackSearch(query, resultsCount, userId = null) {
    try {
      const session = await this.getSessionData(userId);
      if (!session) return;

      if (!session.searches) session.searches = [];
      session.searches.push({
        query,
        resultsCount,
        timestamp: new Date().toISOString()
      });

      await this.saveSessionData(session, userId);
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  // Update category preferences
  updateCategoryPreferences(session) {
    const total = session.viewedCategories.reduce((sum, cat) => sum + cat.count, 0);
    if (total === 0) return;

    session.categoryPreferences = {};
    session.viewedCategories.forEach(cat => {
      session.categoryPreferences[cat.categoryId] = cat.count / total;
    });
  }

  // Merge guest session to user session
  async mergeGuestToUserSession(userId) {
    try {
      const guestData = await AsyncStorage.getItem(this.SESSION_KEY);
      const userKey = `${this.USER_SESSION_PREFIX}${userId}`;
      const userData = await AsyncStorage.getItem(userKey);

      const guest = guestData ? JSON.parse(guestData) : {};
      const user = userData ? JSON.parse(userData) : {};

      // Merge viewed products
      user.viewedProducts = [...(user.viewedProducts || []), ...(guest.viewedProducts || [])];

      // Merge cart items
      user.cartItems = [...(user.cartItems || []), ...(guest.cartItems || [])];

      // Merge category preferences
      user.categoryPreferences = this.mergeCategoryPreferences(
        user.categoryPreferences,
        guest.categoryPreferences
      );

      // Merge searches
      user.searches = [...(user.searches || []), ...(guest.searches || [])];

      // Save merged data
      await AsyncStorage.setItem(userKey, JSON.stringify(user));

      // Clear guest session
      await AsyncStorage.removeItem(this.SESSION_KEY);

      return user;
    } catch (error) {
      console.error('Error merging sessions:', error);
      return null;
    }
  }

  // Merge category preferences
  mergeCategoryPreferences(userPrefs = {}, guestPrefs = {}) {
    const merged = { ...userPrefs };
    
    Object.entries(guestPrefs).forEach(([catId, score]) => {
      if (merged[catId]) {
        merged[catId] = (merged[catId] + score) / 2;
      } else {
        merged[catId] = score;
      }
    });

    return merged;
  }

  // Clean old sessions
  async cleanOldSessions() {
    try {
      const guestSession = await AsyncStorage.getItem(this.SESSION_KEY);
      if (guestSession) {
        const data = JSON.parse(guestSession);
        const age = Date.now() - new Date(data.startTime).getTime();
        
        // Delete sessions older than 7 days
        if (age > 7 * 24 * 60 * 60 * 1000) {
          await AsyncStorage.removeItem(this.SESSION_KEY);
        }
      }
    } catch (error) {
      console.error('Error cleaning old sessions:', error);
    }
  }

  // Check if action requires login
  requiresLogin(action) {
    const loginRequired = [
      'checkout',
      'placeOrder',
      'saveFavorite',
      'viewOrders',
      'trackOrder',
      'writeReview',
      'saveAddress'
    ];
    
    return loginRequired.includes(action);
  }
}

export default new SessionService();
