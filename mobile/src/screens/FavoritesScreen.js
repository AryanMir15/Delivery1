import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import FavoritesService from '../services/FavoritesService';
import AuthGuard from '../utils/authGuard';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const FavoritesScreen = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const user = useSelector(state => state.auth.user);
  const userId = user?._id || null;

  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const s = styles(colors, typography, scale);

  useEffect(() => {

  if (!userId) {
      AuthGuard.showLoginPrompt('saveFavorite', navigation);
      return;
    }
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await FavoritesService.getFavorites(userId);
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleRemoveFavorite = async (productId) => {
    Alert.alert(
      'Remove from Favorites',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const result = await FavoritesService.removeFromFavorites(userId, productId);
            if (result.success) {
              setFavorites(favorites.filter(f => f._id !== productId));
            }
          }
        }
      ]
    );
  };

  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={s.favoriteCard}
      onPress={() => navigation.navigate('FoodDetail', { food: item })}
    >
      <Image
        source={{ uri: item.image }}
        style={s.favoriteImage}
        resizeMode="cover"
      />
      <View style={s.favoriteInfo}>
        <Text style={s.favoriteTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={s.favoriteRestaurant} numberOfLines={1}>
          {item.restaurant?.name || 'Unknown Shop'}
        </Text>
        <View style={s.favoriteFooter}>
          <Text style={s.favoritePrice}>
            {item.price} PKR
          </Text>
          <TouchableOpacity
            style={s.removeButton}
            onPress={() => handleRemoveFavorite(item._id)}
          >
            <Icon name="heart" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!userId) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.header}>
          <TouchableOpacity
            style={s.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Favorites</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.emptyContainer}>
          <Icon name="heart-outline" size={80} color={colors.accentLight} />
          <Text style={s.emptyTitle}>Login Required</Text>
          <Text style={s.emptyText}>
            Please login to save and view your favorite products
          </Text>
          <TouchableOpacity
            style={s.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={s.loginButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Favorites</Text>
        <Text style={s.headerCount}>{favorites.length}</Text>
      </View>

      {loading ? (
        <View style={s.loadingContainer}>
          <Text style={s.loadingText}>Loading favorites...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={s.emptyContainer}>
          <Icon name="heart-outline" size={80} color={colors.accentLight} />
          <Text style={s.emptyTitle}>No Favorites Yet</Text>
          <Text style={s.emptyText}>
            Start adding products to your favorites by tapping the heart icon
          </Text>
          <TouchableOpacity
            style={s.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={s.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={s.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.accent]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(16 * scale),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerCount: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.accent,
    minWidth: Math.round(40 * scale),
    textAlign: 'right',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Math.round(32 * scale),
  },
  emptyTitle: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: Math.round(24 * scale),
    marginBottom: Math.round(12 * scale),
  },
  emptyText: {
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: Math.round(24 * scale),
  },
  loginButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: Math.round(32 * scale),
    paddingVertical: Math.round(14 * scale),
    borderRadius: Math.round(12 * scale),
    marginTop: Math.round(24 * scale),
  },
  loginButtonText: {
    color: colors.textInverse,
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
  },
  browseButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: Math.round(32 * scale),
    paddingVertical: Math.round(14 * scale),
    borderRadius: Math.round(12 * scale),
    marginTop: Math.round(24 * scale),
  },
  browseButtonText: {
    color: colors.textInverse,
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
  },
  listContainer: {
    padding: Math.round(16 * scale),
  },
  favoriteCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    marginBottom: Math.round(12 * scale),
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteImage: {
    width: Math.round(100 * scale),
    height: Math.round(100 * scale),
  },
  favoriteInfo: {
    flex: 1,
    padding: Math.round(12 * scale),
    justifyContent: 'space-between',
  },
  favoriteTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  favoriteRestaurant: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(8 * scale),
  },
  favoriteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoritePrice: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  removeButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.dangerSurface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FavoritesScreen;
