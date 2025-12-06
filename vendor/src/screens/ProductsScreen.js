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
import { useSelector, useDispatch } from 'react-redux';
import { useQuery, useMutation } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { GET_FOODS } from '../api/queries';
import { UPDATE_FOOD } from '../api/mutations';
import { setProducts, updateProduct } from '../store/productSlice';

export default function ProductsScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedRestaurant } = useSelector((state) => state.auth);
  const { products } = useSelector((state) => state.products);

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

  const renderProduct = ({ item: product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => handleProductPress(product)}
      onLongPress={() => navigation.navigate('ProductDetail', { product })}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{
            uri: product.image || 'https://via.placeholder.com/100',
          }}
          style={styles.productImage}
        />
        {product.images && product.images.length > 0 && (
          <View style={styles.imageCountBadge}>
            <Ionicons name="images" size={12} color="#fff" />
            <Text style={styles.imageCountText}>+{product.images.length}</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.productCategory}>{product.category?.title}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>
            ETB {product.variations?.[0]?.price || 0}
          </Text>
          <View
            style={[
              styles.stockBadge,
              product.isOutOfStock ? styles.outOfStock : styles.inStock,
            ]}
          >
            <Text style={styles.stockText}>
              {product.isOutOfStock ? 'Out of Stock' : 'In Stock'}
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={styles.stockToggle}
        onPress={(e) => {
          e.stopPropagation();
          handleToggleStock(product);
        }}
      >
        <Ionicons
          name={product.isOutOfStock ? 'eye-off' : 'eye'}
          size={24}
          color={product.isOutOfStock ? '#F44336' : '#4CAF50'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefetch={refetch} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="fast-food-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('ProductForm')}
            >
              <Text style={styles.addButtonText}>Add Your First Product</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Floating Add Button */}
      {products.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('ProductForm')}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  listContent: {
    padding: 15,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageWrapper: {
    position: 'relative',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  productCategory: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inStock: {
    backgroundColor: '#E8F5E9',
  },
  outOfStock: {
    backgroundColor: '#FFEBEE',
  },
  stockText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  stockToggle: {
    justifyContent: 'center',
    paddingLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 15,
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
