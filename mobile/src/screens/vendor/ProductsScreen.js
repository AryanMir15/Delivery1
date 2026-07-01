import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, getStatusColor } from '../../theme';
import useResponsive from '../../hooks/useResponsive';

import { GET_FOODS, GET_RESTAURANTS_BY_OWNER } from '../../api/queries';
import { UPDATE_FOOD } from '../../api/mutations';
import { setProducts, updateProduct } from '../../store/productSlice';

export default function ProductsScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const { products } = useSelector((state) => state.products);

  const { data: restaurantData } = useQuery(GET_RESTAURANTS_BY_OWNER);
  const selectedRestaurant = restaurantData?.restaurantsByOwner?.[0];

  const { refetch, loading } = useQuery(GET_FOODS, {
    variables: { restaurant: selectedRestaurant?._id },
    skip: !selectedRestaurant,
    onCompleted: (data) => {
      if (data?.foods) {
        dispatch(setProducts(data.foods));
      }
    },
  });

  const [updateFood] = useMutation(UPDATE_FOOD);

  const handleToggleStock = async (product) => {
    try {
      const { data } = await updateFood({
        variables: {
          id: product._id,
          isOutOfStock: !product.isOutOfStock,
        },
      });

      if (data?.updateFood) {
        dispatch(updateProduct(data.updateFood));
        Alert.alert(
          'Success',
          `Product ${data.updateFood.isOutOfStock ? 'marked as out of stock' : 'marked as available'}`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update product');
    }
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProductPress = (product) => {
    // Show action sheet
    Alert.alert(
      product.title,
      'Choose an action',
      [
        {
          text: 'View Details',
          onPress: () => navigation.navigate('ProductDetail', { product }),
        },
        {
          text: 'Edit Product',
          onPress: () => navigation.navigate('ProductForm', { product }),
        },
        {
          text: 'Toggle Stock',
          onPress: () => handleToggleStock(product),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const s = styles(colors, typography, scale);

  const renderProduct = ({ item: product }) => (
    <TouchableOpacity
      style={s.productCard}
      onPress={() => handleProductPress(product)}
      onLongPress={() => navigation.navigate('ProductDetail', { product })}
    >
      <View style={s.imageWrapper}>
        <Image
          source={{
            uri: product.image || 'https://via.placeholder.com/100',
          }}
          style={s.productImage}
        />
        {product.images && product.images.length > 0 && (
          <View style={s.imageCountBadge}>
            <Ionicons name="images" size={12} color={colors.textInverse} />
            <Text style={s.imageCountText}>+{product.images.length}</Text>
          </View>
        )}
      </View>
      <View style={s.productInfo}>
        <Text style={s.productTitle} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={s.productCategory}>{product.category?.title}</Text>
        <View style={s.productFooter}>
          <Text style={s.productPrice}>
            PKR {product.variations?.[0]?.price || 0}
          </Text>
          <View
            style={[
              s.stockBadge,
              product.isOutOfStock ? s.outOfStock : s.inStock,
            ]}
          >
            <Text style={s.stockText}>
              {product.isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={s.stockToggle}
        onPress={(e) => {
          e.stopPropagation();
          handleToggleStock(product);
        }}
      >
        <Ionicons
          name={product.isOutOfStock ? 'eye-off' : 'eye'}
          size={24}
          color={product.isOutOfStock ? colors.error : colors.success}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container} edges={['left', 'right', 'bottom']}>
    <View style={s.container}>
      {/* Search Bar */}
      <View style={s.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textTertiary} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefetch={refetch} />
        }
        ListEmptyComponent={
          <View style={s.emptyState}>
            <Ionicons name="fast-food-outline" size={64} color={colors.textTertiary} />
            <Text style={s.emptyText}>No products found</Text>
            <TouchableOpacity
              style={s.addButton}
              onPress={() => navigation.navigate('ProductForm')}
            >
              <Text style={s.addButtonText}>Add Your First Product</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Add Button */}
      {products.length > 0 && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => navigation.navigate('ProductForm')}
        >
          <Ionicons name="add" size={32} color={colors.textInverse} />
        </TouchableOpacity>
      )}
    </View>
    </SafeAreaView>
  );
}

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: Math.round(15 * scale),
    paddingHorizontal: Math.round(15 * scale),
    borderRadius: Math.round(10 * scale),
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.1,
    shadowRadius: Math.round(4 * scale),
  },
  searchIcon: {
    marginRight: Math.round(10 * scale),
  },
  searchInput: {
    flex: 1,
    height: Math.round(45 * scale),
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
  },
  listContent: {
    padding: Math.round(15 * scale),
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: Math.round(10 * scale),
    padding: Math.round(12 * scale),
    marginBottom: Math.round(15 * scale),
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.1,
    shadowRadius: Math.round(4 * scale),
  },
  imageWrapper: {
    position: 'relative',
  },
  productImage: {
    width: Math.round(80 * scale),
    height: Math.round(80 * scale),
    borderRadius: Math.round(8 * scale),
    backgroundColor: colors.surfaceVariant,
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: Math.round(5 * scale),
    right: Math.round(5 * scale),
    backgroundColor: colors.overlay,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.round(6 * scale),
    paddingVertical: Math.round(2 * scale),
    borderRadius: Math.round(10 * scale),
    gap: Math.round(2 * scale),
  },
  imageCountText: {
    color: colors.textInverse,
    fontSize: Math.round(10 * scale),
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
    marginLeft: Math.round(12 * scale),
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  productCategory: {
    fontSize: Math.round(12 * scale),
    color: colors.textTertiary,
    marginTop: Math.round(4 * scale),
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Math.round(8 * scale),
  },
  productPrice: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  stockBadge: {
    paddingHorizontal: Math.round(10 * scale),
    paddingVertical: Math.round(4 * scale),
    borderRadius: Math.round(12 * scale),
  },
  inStock: {
    backgroundColor: `${colors.success}20`,
  },
  outOfStock: {
    backgroundColor: `${colors.error}20`,
  },
  stockText: {
    fontSize: Math.round(11 * scale),
    fontWeight: 'bold',
  },
  stockToggle: {
    justifyContent: 'center',
    paddingLeft: Math.round(10 * scale),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.round(60 * scale),
  },
  emptyText: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textTertiary,
    marginTop: Math.round(15 * scale),
    marginBottom: Math.round(20 * scale),
  },
  addButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: Math.round(30 * scale),
    paddingVertical: Math.round(15 * scale),
    borderRadius: Math.round(25 * scale),
  },
  addButtonText: {
    color: colors.textInverse,
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: Math.round(20 * scale),
    bottom: Math.round(20 * scale),
    width: Math.round(60 * scale),
    height: Math.round(60 * scale),
    borderRadius: Math.round(30 * scale),
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.3,
    shadowRadius: Math.round(4 * scale),
  },
});
