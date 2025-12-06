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

const FoodDetailScreenSimple = ({ navigation, route }) => {
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

  if (!food) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Food not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <TouchableOpacity onPress={handleToggleFavorite}>
            <Icon 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#E63946" : "#000"} 
            />
          </TouchableOpacity>
        </View>

        {/* Image */}
        <Image source={{ uri: food.image || '' }} style={styles.foodImage} />

        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.foodName}>{String(food.title || '')}</Text>
          <Text style={styles.foodDescription}>{String(food.description || '')}</Text>
          
          {/* Restaurant */}
          <View style={styles.restaurantInfo}>
            <Icon name="store" size={20} color="#FF6B35" />
            <Text style={styles.restaurantName}>{String(food.restaurant?.name || 'Restaurant')}</Text>
          </View>

          {/* Variations */}
          <Text style={styles.sectionTitle}>Select Size</Text>
          {food.variations?.map((v) => (
            <TouchableOpacity
              key={String(v._id || v.id)}
              style={[
                styles.variationItem,
                selectedVariation?.id === v.id && styles.variationSelected,
              ]}
              onPress={() => setSelectedVariation(v)}
            >
              <Text style={styles.variationTitle}>{String(v.title || '')}</Text>
              <Text style={styles.variationPrice}>{`${v.price || 0} ETB`}</Text>
            </TouchableOpacity>
          ))}

          {/* Quantity */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionTitle}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Icon name="minus" size={20} color="#000" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{String(quantity)}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => setQuantity(quantity + 1)}
              >
                <Icon name="plus" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{`${calculateTotal().toFixed(2)} ETB`}</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
          <Text style={styles.addButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  foodImage: { width: '100%', height: 250 },
  infoSection: { padding: 16 },
  foodName: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  foodDescription: { fontSize: 14, color: '#666', marginBottom: 16 },
  restaurantInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  restaurantName: { fontSize: 16, marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  variationItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 8 },
  variationSelected: { borderColor: '#FF6B35', backgroundColor: '#FFF3E0' },
  variationTitle: { fontSize: 16 },
  variationPrice: { fontSize: 16, fontWeight: 'bold', color: '#FF6B35' },
  quantitySection: { marginTop: 16 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  quantityButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  quantityText: { fontSize: 20, fontWeight: 'bold', marginHorizontal: 20 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderTopWidth: 1, borderColor: '#ddd' },
  totalLabel: { fontSize: 14, color: '#666' },
  totalValue: { fontSize: 20, fontWeight: 'bold', color: '#FF6B35' },
  addButton: { backgroundColor: '#FF6B35', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 50 },
});

export default FoodDetailScreenSimple;
