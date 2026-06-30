import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { GET_FOOD } from '../api/queries';
import { addToCart } from '../store/cartSlice';
import FavoritesService from '../services/FavoritesService';
import SessionService from '../services/SessionService';
import useProductTracking from '../hooks/useProductTracking';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const FoodDetailScreenSimple = ({ navigation, route }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const dispatch = useDispatch();
  const user = useSelector(state => state.auth.user);
  const userId = user?._id || null;
  
  const { food: foodParam } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Track product view with time spent
  const categoryId = foodParam?.category?._id || foodParam?.category;
  useProductTracking(foodParam?._id || foodParam?.id, categoryId);

  const { data } = useQuery(GET_FOOD, {
    variables: { id: foodParam._id || foodParam.id },
    skip: !foodParam._id && !foodParam.id,
  });

  const food = data?.food || foodParam;

  useEffect(() => {
    if (food?.variations?.[0]) {
      setSelectedVariation(food.variations[0]);
    }
  }, [food]);

  // Check if product is in favorites
  useEffect(() => {
    const checkFavorite = async () => {
      if (food?._id || food?.id) {
        const result = await FavoritesService.isFavorite(userId, food._id || food.id);
        setIsFavorite(result);
      }
    };
    checkFavorite();
  }, [food, userId]);

  const handleToggleFavorite = async () => {
    if (!userId) {
      Alert.alert(
        'Login Required',
        'Please login to save favorites',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Login', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    const productId = food._id || food.id;
    
    if (isFavorite) {
      const result = await FavoritesService.removeFromFavorites(userId, productId);
      if (result.success) {
        setIsFavorite(false);
        Alert.alert('Success', 'Removed from favorites');
      }
    } else {
      const result = await FavoritesService.addToFavorites(userId, food);
      if (result.success) {
        setIsFavorite(true);
        Alert.alert('Success', 'Added to favorites');
      } else if (result.requiresLogin) {
        Alert.alert(
          'Login Required',
          'Please login to save favorites',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => navigation.navigate('Login') }
          ]
        );
      }
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariation) {
      Alert.alert('Error', 'Please select a variation');
      return;
    }

    const cartItem = {
      food: food._id || food.id,
      title: food.title,
      image: food.image,
      restaurant: food.restaurant?._id || food.restaurant?.id,
      restaurantName: food.restaurant?.name,
      variation: {
        id: selectedVariation._id || selectedVariation.id,
        title: selectedVariation.title,
        price: selectedVariation.price,
      },
      quantity: quantity,
      addons: [],
    };

    dispatch(addToCart(cartItem));
    
    // Track add to cart
    await SessionService.trackAddToCart(
      food._id || food.id,
      categoryId,
      quantity,
      userId
    );
    
    Alert.alert('Success', 'Added to cart!');
    navigation.goBack();
  };

  const calculateTotal = () => {
    if (!selectedVariation) return 0;
    return (selectedVariation.discounted || selectedVariation.price) * quantity;
  };

  const s = styles(colors, typography, scale);

  if (!food) {
    return (
      <SafeAreaView style={s.container}>
        <Text style={s.errorText}>Food not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <ScrollView>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Product Details</Text>
          <TouchableOpacity onPress={handleToggleFavorite}>
            <Icon 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? colors.error : colors.textPrimary} 
            />
          </TouchableOpacity>
        </View>

        {/* Image */}
        <Image source={{ uri: food.image || '' }} style={s.foodImage} />

        {/* Info */}
        <View style={s.infoSection}>
          <Text style={s.foodName}>{String(food.title || '')}</Text>
          <Text style={s.foodDescription}>{String(food.description || '')}</Text>
          
          {/* Restaurant */}
          <View style={s.restaurantInfo}>
            <Icon name="store" size={20} color={colors.accent} />
            <Text style={s.restaurantName}>{String(food.restaurant?.name || 'Restaurant')}</Text>
          </View>

          {/* Variations */}
          <Text style={s.sectionTitle}>Select Size</Text>
          {food.variations?.map((v) => (
            <TouchableOpacity
              key={String(v._id || v.id)}
              style={[
                s.variationItem,
                selectedVariation?.id === v.id && s.variationSelected,
              ]}
              onPress={() => setSelectedVariation(v)}
            >
              <Text style={s.variationTitle}>{String(v.title || '')}</Text>
              <Text style={s.variationPrice}>{`${v.price || 0} PKR`}</Text>
            </TouchableOpacity>
          ))}

          {/* Quantity */}
          <View style={s.quantitySection}>
            <Text style={s.sectionTitle}>Quantity</Text>
            <View style={s.quantityControls}>
              <TouchableOpacity
                style={s.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Icon name="minus" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={s.quantityText}>{String(quantity)}</Text>
              <TouchableOpacity
                style={s.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Icon name="plus" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        <View>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>{`${calculateTotal().toFixed(2)} PKR`}</Text>
        </View>
        <TouchableOpacity style={s.addButton} onPress={handleAddToCart}>
          <Text style={s.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Math.round(16 * scale) },
  headerTitle: { fontSize: Math.round(18 * scale), fontWeight: 'bold' },
  foodImage: { width: '100%', height: Math.round(250 * scale) },
  infoSection: { padding: Math.round(16 * scale) },
  foodName: { fontSize: Math.round(24 * scale), fontWeight: 'bold', marginBottom: Math.round(8 * scale) },
  foodDescription: { fontSize: Math.round(14 * scale), color: colors.textSecondary, marginBottom: Math.round(16 * scale) },
  restaurantInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: Math.round(16 * scale) },
  restaurantName: { fontSize: Math.round(16 * scale), marginLeft: Math.round(8 * scale) },
  sectionTitle: { fontSize: Math.round(18 * scale), fontWeight: 'bold', marginTop: Math.round(16 * scale), marginBottom: Math.round(8 * scale) },
  variationItem: { flexDirection: 'row', justifyContent: 'space-between', padding: Math.round(12 * scale), borderWidth: 1, borderColor: colors.border, borderRadius: Math.round(8 * scale), marginBottom: Math.round(8 * scale) },
  variationSelected: { borderColor: colors.accent, backgroundColor: colors.accentSurface },
  variationTitle: { fontSize: Math.round(16 * scale) },
  variationPrice: { fontSize: Math.round(16 * scale), fontWeight: 'bold', color: colors.accent },
  quantitySection: { marginTop: Math.round(16 * scale) },
  quantityControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: Math.round(8 * scale) },
  quantityButton: { width: Math.round(40 * scale), height: Math.round(40 * scale), borderRadius: Math.round(20 * scale), backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  quantityText: { fontSize: Math.round(20 * scale), fontWeight: 'bold', marginHorizontal: Math.round(20 * scale) },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Math.round(16 * scale), borderTopWidth: 1, borderColor: colors.border },
  totalLabel: { fontSize: Math.round(14 * scale), color: colors.textSecondary },
  totalValue: { fontSize: Math.round(20 * scale), fontWeight: 'bold', color: colors.accent },
  addButton: { backgroundColor: colors.accent, paddingHorizontal: Math.round(32 * scale), paddingVertical: Math.round(12 * scale), borderRadius: Math.round(8 * scale) },
  addButtonText: { color: colors.textInverse, fontSize: Math.round(16 * scale), fontWeight: 'bold' },
  errorText: { fontSize: Math.round(16 * scale), textAlign: 'center', marginTop: Math.round(50 * scale) },
});

export default FoodDetailScreenSimple;
