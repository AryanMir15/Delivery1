import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

class FavoritesService {
  constructor() {
    this.FAVORITES_KEY = 'userFavorites_';
  }

  // Get user favorites
  async getFavorites(userId) {
    try {
      if (!userId) return [];
      
      const key = `${this.FAVORITES_KEY}${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  // Add to favorites
  async addToFavorites(userId, product) {
    try {
      if (!userId) {
        return { success: false, requiresLogin: true };
      }

      const favorites = await this.getFavorites(userId);
      
      // Check if already in favorites
      if (favorites.find(f => f._id === product._id)) {
        return { success: false, message: 'Already in favorites' };
      }

      favorites.push({
        _id: product._id,
        title: product.title,
        image: product.image,
        price: product.variations?.[0]?.price || 0,
        restaurant: product.restaurant,
        category: product.category,
        addedAt: new Date().toISOString()
      });

      const key = `${this.FAVORITES_KEY}${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(favorites));
      
      return { success: true, message: 'Added to favorites' };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return { success: false, message: 'Failed to add to favorites' };
    }
  }

  // Remove from favorites
  async removeFromFavorites(userId, productId) {
    try {
      if (!userId) return { success: false };

      const favorites = await this.getFavorites(userId);
      const filtered = favorites.filter(f => f._id !== productId);

      const key = `${this.FAVORITES_KEY}${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(filtered));
      
      return { success: true, message: 'Removed from favorites' };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return { success: false, message: 'Failed to remove from favorites' };
    }
  }

  // Check if product is in favorites
  async isFavorite(userId, productId) {
    try {
      if (!userId) return false;
      
      const favorites = await this.getFavorites(userId);
      return favorites.some(f => f._id === productId);
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }

  // Clear all favorites
  async clearFavorites(userId) {
    try {
      if (!userId) return { success: false };

      const key = `${this.FAVORITES_KEY}${userId}`;
      await AsyncStorage.removeItem(key);
      
      return { success: true, message: 'Favorites cleared' };
    } catch (error) {
      console.error('Error clearing favorites:', error);
      return { success: false, message: 'Failed to clear favorites' };
    }
  }
}

export default new FavoritesService();
