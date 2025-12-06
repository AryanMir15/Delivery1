import SessionService from './SessionService';

class RecommendationEngine {
  // Shuffle array utility
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Get recommended products
  async getRecommendedProducts(allProducts, userId = null, limit = 20) {
    try {
      const session = await SessionService.getSessionData(userId);
      if (!session) return this.shuffleArray(allProducts).slice(0, limit);

      const preferences = session.categoryPreferences || {};
      
      // If no preferences yet, return random products
      if (Object.keys(preferences).length === 0) {
        return this.shuffleArray(allProducts).slice(0, limit);
      }

      // Sort categories by user preference
      const sortedCategories = Object.entries(preferences)
        .sort((a, b) => b[1] - a[1])
        .map(([catId]) => catId);

      const recommendations = [];
      const productsPerCategory = {};

      // Allocate products per category based on preference
      sortedCategories.forEach(catId => {
        const preference = preferences[catId];
        const count = Math.ceil(limit * preference);
        productsPerCategory[catId] = count;
      });

      // Select products from each category
      sortedCategories.forEach(catId => {
        const categoryProducts = allProducts.filter(p => 
          p.category && (p.category._id === catId || p.category === catId)
        );
        const count = productsPerCategory[catId] || 0;

        // Prioritize not viewed products
        const viewedIds = session.viewedProducts.map(v => v.productId);
        const notViewed = categoryProducts.filter(p => !viewedIds.includes(p._id));

        const selected = this.shuffleArray(notViewed).slice(0, count);
        recommendations.push(...selected);
      });

      // Fill remaining slots with diverse products
      while (recommendations.length < limit && recommendations.length < allProducts.length) {
        const remaining = allProducts.filter(p => 
          !recommendations.find(r => r._id === p._id)
        );
        if (remaining.length === 0) break;

        const random = remaining[Math.floor(Math.random() * remaining.length)];
        recommendations.push(random);
      }

      return this.shuffleArray(recommendations).slice(0, limit);
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.shuffleArray(allProducts).slice(0, limit);
    }
  }

  // Get category products with smart limit
  async getCategoryProducts(categoryId, allProducts, userId = null, baseLimit = 20) {
    try {
      const session = await SessionService.getSessionData(userId);
      
      // Filter products by category
      const categoryProducts = allProducts.filter(p => 
        p.category && (p.category._id === categoryId || p.category === categoryId)
      );

      if (!session) {
        return this.shuffleArray(categoryProducts).slice(0, baseLimit);
      }

      // Get user's viewed products in this category
      const viewedInCategory = session.viewedProducts
        .filter(v => v.categoryId === categoryId)
        .map(v => v.productId);

      // Prioritize products user hasn't seen
      const notViewed = categoryProducts.filter(p => !viewedInCategory.includes(p._id));
      const viewed = categoryProducts.filter(p => viewedInCategory.includes(p._id));

      // Get visit count for this category
      const categoryVisits = session.viewedCategories.find(c => c.categoryId === categoryId);
      const visitCount = categoryVisits?.count || 0;

      // More visits = show more products (max 50)
      const displayLimit = Math.min(baseLimit + (visitCount * 2), 50);

      // Combine: new products first, then viewed ones
      const combined = [
        ...this.shuffleArray(notViewed),
        ...this.shuffleArray(viewed)
      ];

      return combined.slice(0, displayLimit);
    } catch (error) {
      console.error('Error getting category products:', error);
      return this.shuffleArray(allProducts.filter(p => 
        p.category && (p.category._id === categoryId || p.category === categoryId)
      )).slice(0, baseLimit);
    }
  }

  // Generate recommendations with scoring
  async generateRecommendations(allProducts, userId = null) {
    try {
      const session = await SessionService.getSessionData(userId);
      if (!session) return this.shuffleArray(allProducts).slice(0, 20);

      // Score each product
      const scoredProducts = allProducts.map(product => {
        let score = 0;

        const categoryId = product.category?._id || product.category;

        // 1. Category preference (40% weight)
        const categoryPref = session.categoryPreferences[categoryId] || 0;
        score += categoryPref * 0.4;

        // 2. Not viewed bonus (30% weight)
        const isViewed = session.viewedProducts.find(v => v.productId === product._id);
        if (!isViewed) score += 0.3;

        // 3. Similar to cart items (20% weight)
        const inCart = session.cartItems.find(c => c.categoryId === categoryId);
        if (inCart) score += 0.2;

        // 4. Trending/popular (10% weight)
        score += Math.random() * 0.1;

        return { product, score };
      });

      // Sort by score and return top products
      return scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, 20)
        .map(item => item.product);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.shuffleArray(allProducts).slice(0, 20);
    }
  }

  // Get similar products
  async getSimilarProducts(productId, allProducts, limit = 5) {
    try {
      const product = allProducts.find(p => p._id === productId);
      if (!product) return [];

      const categoryId = product.category?._id || product.category;

      // Find products in same category
      const sameCategory = allProducts.filter(p => {
        const pCatId = p.category?._id || p.category;
        return pCatId === categoryId && p._id !== productId;
      });

      // Find products in similar price range (±20%)
      const productPrice = product.variations?.[0]?.price || 0;
      const similarPrice = sameCategory.filter(p => {
        const price = p.variations?.[0]?.price || 0;
        if (productPrice === 0) return true;
        return Math.abs(price - productPrice) / productPrice <= 0.2;
      });

      return this.shuffleArray(similarPrice.length > 0 ? similarPrice : sameCategory).slice(0, limit);
    } catch (error) {
      console.error('Error getting similar products:', error);
      return [];
    }
  }

  // Get trending products
  async getTrendingProducts(allProducts, userId = null, limit = 10) {
    try {
      const session = await SessionService.getSessionData(userId);
      if (!session) return this.shuffleArray(allProducts).slice(0, limit);

      // Count views per product
      const viewCounts = {};
      session.viewedProducts.forEach(v => {
        viewCounts[v.productId] = (viewCounts[v.productId] || 0) + 1;
      });

      // Sort products by view count
      return allProducts
        .map(p => ({ product: p, views: viewCounts[p._id] || 0 }))
        .sort((a, b) => b.views - a.views)
        .slice(0, limit)
        .map(item => item.product);
    } catch (error) {
      console.error('Error getting trending products:', error);
      return this.shuffleArray(allProducts).slice(0, limit);
    }
  }
}

export default new RecommendationEngine();
