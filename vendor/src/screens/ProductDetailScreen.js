import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // Combine primary image with additional images
  const allImages = [
    product.image,
    ...(product.images || []),
  ].filter(Boolean);

  return (
    <ScrollView style={styles.container}>
      {/* Image Gallery */}
      <View style={styles.gallerySection}>
        {/* Main Image */}
        <TouchableOpacity
          style={styles.mainImageContainer}
          onPress={() => setFullScreenImage(allImages[selectedImageIndex])}
        >
          <Image
            source={{ uri: allImages[selectedImageIndex] || 'https://via.placeholder.com/400' }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          <View style={styles.imageCounter}>
            <Ionicons name="images" size={16} color="#fff" />
            <Text style={styles.imageCounterText}>
              {selectedImageIndex + 1}/{allImages.length}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Thumbnail Gallery */}
        {allImages.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.thumbnailScroll}
          >
            <View style={styles.thumbnailContainer}>
              {allImages.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.thumbnail,
                    selectedImageIndex === index && styles.thumbnailActive,
                  ]}
                  onPress={() => setSelectedImageIndex(index)}
                >
                  <Image
                    source={{ uri: img }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.infoSection}>
        <View style={styles.header}>
          <Text style={styles.title}>{product.title}</Text>
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

        {product.category && (
          <View style={styles.categoryRow}>
            <Ionicons name="pricetag" size={16} color="#666" />
            <Text style={styles.category}>{product.category.title}</Text>
          </View>
        )}

        {product.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>
          </View>
        )}

        {/* Variations */}
        {product.variations && product.variations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Variations & Pricing</Text>
            {product.variations.map((variation, index) => (
              <View key={index} style={styles.variationCard}>
                <View style={styles.variationInfo}>
                  <Text style={styles.variationTitle}>
                    {variation.title || `Variation ${index + 1}`}
                  </Text>
                  {variation.isOutOfStock && (
                    <View style={styles.variationOutOfStock}>
                      <Text style={styles.variationOutOfStockText}>
                        Out of Stock
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.priceRow}>
                  {variation.discounted > 0 && variation.discounted < variation.price ? (
                    <>
                      <Text style={styles.priceOriginal}>
                        ETB {variation.price}
                      </Text>
                      <Text style={styles.priceDiscounted}>
                        ETB {variation.discounted}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.price}>ETB {variation.price}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Edit Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('ProductForm', { product })}
        >
          <Ionicons name="create" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Edit Product</Text>
        </TouchableOpacity>
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={fullScreenImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullScreenImage(null)}
      >
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setFullScreenImage(null)}
          >
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>
          <Image
            source={{ uri: fullScreenImage }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gallerySection: {
    backgroundColor: '#fff',
  },
  mainImageContainer: {
    width: width,
    height: width,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  thumbnailScroll: {
    padding: 10,
  },
  thumbnailContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#4CAF50',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  inStock: {
    backgroundColor: '#E8F5E9',
  },
  outOfStock: {
    backgroundColor: '#FFEBEE',
  },
  stockText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  category: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  variationCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  variationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  variationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  variationOutOfStock: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  variationOutOfStockText: {
    fontSize: 11,
    color: '#F44336',
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  priceOriginal: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  priceDiscounted: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 10,
    gap: 8,
    marginTop: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fullScreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  fullScreenImage: {
    width: width,
    height: '100%',
  },
});
