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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, getStatusColor } from '../../theme';
import useResponsive from '../../hooks/useResponsive';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState(null);

  // Combine primary image with additional images
  const allImages = [
    product.image,
    ...(product.images || []),
  ].filter(Boolean);

  const s = styles(colors, typography, scale);

  return (
    <SafeAreaView style={s.container} edges={['left', 'right', 'bottom']}>
    <ScrollView style={s.container} contentContainerStyle={s.scrollInner}>
      {/* Image Gallery */}
      <View style={s.gallerySection}>
        {/* Main Image */}
        <TouchableOpacity
          style={s.mainImageContainer}
          onPress={() => setFullScreenImage(allImages[selectedImageIndex])}
        >
          <Image
            source={{ uri: allImages[selectedImageIndex] || 'https://via.placeholder.com/400' }}
            style={s.mainImage}
            resizeMode="cover"
          />
          <View style={s.imageCounter}>
            <Ionicons name="images" size={16} color={colors.textInverse} />
            <Text style={s.imageCounterText}>
              {selectedImageIndex + 1}/{allImages.length}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Thumbnail Gallery */}
        {allImages.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.thumbnailScroll}
          >
            <View style={s.thumbnailContainer}>
              {allImages.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    s.thumbnail,
                    selectedImageIndex === index && s.thumbnailActive,
                  ]}
                  onPress={() => setSelectedImageIndex(index)}
                >
                  <Image
                    source={{ uri: img }}
                    style={s.thumbnailImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Product Info */}
      <View style={s.infoSection}>
        <View style={s.header}>
          <Text style={s.title}>{product.title}</Text>
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

        {product.category && (
          <View style={s.categoryRow}>
            <Ionicons name="pricetag" size={16} color={colors.textSecondary} />
            <Text style={s.category}>{product.category.title}</Text>
          </View>
        )}

        {product.description && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Description</Text>
            <Text style={s.description}>{product.description}</Text>
          </View>
        )}

        {/* Variations */}
        {product.variations && product.variations.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Variations & Pricing</Text>
            {product.variations.map((variation, index) => (
              <View key={index} style={s.variationCard}>
                <View style={s.variationInfo}>
                  <Text style={s.variationTitle}>
                    {variation.title || `Variation ${index + 1}`}
                  </Text>
                  {variation.isOutOfStock && (
                    <View style={s.variationOutOfStock}>
                      <Text style={s.variationOutOfStockText}>
                        Out of Stock
                      </Text>
                    </View>
                  )}
                </View>
                <View style={s.priceRow}>
                  {variation.discounted > 0 && variation.discounted < variation.price ? (
                    <>
                      <Text style={s.priceOriginal}>
                        PKR {variation.price}
                      </Text>
                      <Text style={s.priceDiscounted}>
                        PKR {variation.discounted}
                      </Text>
                    </>
                  ) : (
                    <Text style={s.price}>PKR {variation.price}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Edit Button */}
        <TouchableOpacity
          style={s.editButton}
          onPress={() => navigation.navigate('ProductForm', { product })}
        >
          <Ionicons name="create" size={20} color={colors.textInverse} />
          <Text style={s.editButtonText}>Edit Product</Text>
        </TouchableOpacity>
      </View>

      {/* Full Screen Image Modal */}
      <Modal
        visible={fullScreenImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullScreenImage(null)}
      >
        <View style={s.fullScreenContainer}>
          <TouchableOpacity
            style={s.closeButton}
            onPress={() => setFullScreenImage(null)}
          >
            <Ionicons name="close-circle" size={40} color={colors.textInverse} />
          </TouchableOpacity>
          <Image
            source={{ uri: fullScreenImage }}
            style={s.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollInner: {
    paddingBottom: Math.round(40 * scale),
  },
  gallerySection: {
    backgroundColor: colors.surface,
  },
  mainImageContainer: {
    width: width,
    height: width,
    backgroundColor: colors.surfaceVariant,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  imageCounter: {
    position: 'absolute',
    bottom: Math.round(15 * scale),
    right: Math.round(15 * scale),
    backgroundColor: colors.overlay,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.round(12 * scale),
    paddingVertical: Math.round(6 * scale),
    borderRadius: Math.round(20 * scale),
    gap: Math.round(5 * scale),
  },
  imageCounterText: {
    color: colors.textInverse,
    fontSize: Math.round(14 * scale),
    fontWeight: 'bold',
  },
  thumbnailScroll: {
    padding: Math.round(10 * scale),
  },
  thumbnailContainer: {
    flexDirection: 'row',
    gap: Math.round(10 * scale),
  },
  thumbnail: {
    width: Math.round(70 * scale),
    height: Math.round(70 * scale),
    borderRadius: Math.round(8 * scale),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: colors.accent,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  infoSection: {
    backgroundColor: colors.surface,
    marginTop: Math.round(10 * scale),
    padding: Math.round(20 * scale),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Math.round(15 * scale),
  },
  title: {
    flex: 1,
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginRight: Math.round(10 * scale),
  },
  stockBadge: {
    paddingHorizontal: Math.round(12 * scale),
    paddingVertical: Math.round(6 * scale),
    borderRadius: Math.round(15 * scale),
  },
  inStock: {
    backgroundColor: `${colors.success}20`,
  },
  outOfStock: {
    backgroundColor: `${colors.error}20`,
  },
  stockText: {
    fontSize: Math.round(12 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.round(8 * scale),
    marginBottom: Math.round(20 * scale),
  },
  category: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  section: {
    marginBottom: Math.round(20 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(10 * scale),
  },
  description: {
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
    lineHeight: 24,
  },
  variationCard: {
    backgroundColor: colors.surfaceVariant,
    padding: Math.round(15 * scale),
    borderRadius: Math.round(10 * scale),
    marginBottom: Math.round(10 * scale),
    borderWidth: 1,
    borderColor: colors.border,
  },
  variationInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Math.round(8 * scale),
  },
  variationTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  variationOutOfStock: {
    backgroundColor: `${colors.error}20`,
    paddingHorizontal: Math.round(8 * scale),
    paddingVertical: Math.round(4 * scale),
    borderRadius: Math.round(10 * scale),
  },
  variationOutOfStockText: {
    fontSize: Math.round(11 * scale),
    color: colors.error,
    fontWeight: 'bold',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.round(10 * scale),
  },
  price: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  priceOriginal: {
    fontSize: Math.round(16 * scale),
    color: colors.textTertiary,
    textDecorationLine: 'line-through',
  },
  priceDiscounted: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.error,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    padding: Math.round(16 * scale),
    borderRadius: Math.round(10 * scale),
    gap: Math.round(8 * scale),
    marginTop: Math.round(10 * scale),
  },
  editButtonText: {
    color: colors.textInverse,
    fontSize: Math.round(18 * scale),
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
    top: Math.round(50 * scale),
    right: Math.round(20 * scale),
    zIndex: 10,
  },
  fullScreenImage: {
    width: width,
    height: '100%',
  },
});
