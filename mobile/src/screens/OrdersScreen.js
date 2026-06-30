import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useQuery } from '@apollo/client';
import { GET_ORDERS_BY_USER } from '../api/queries';
import { formatDate } from '../utils/dateFormatter';
import { useTheme, getStatusColor } from '../theme';
import useResponsive from '../hooks/useResponsive';
import StatusBadge from '../components/StatusBadge';

const ORDER_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'picked', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const OrdersScreen = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const { data, loading, refetch, error } = useQuery(GET_ORDERS_BY_USER, {
    fetchPolicy: 'network-only',
  });

  const orders = data?.ordersByUser || [];

  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === 'all') return true;
    return order.orderStatus === selectedFilter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'clock-outline';
      case 'accepted':
        return 'check-circle';
      case 'assigned':
        return 'bike';
      case 'picked':
        return 'package-variant';
      case 'delivered':
        return 'check-all';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'information';
    }
  };

  const renderOrderCard = ({ item }) => {
    const statusColor = getStatusColor(colors, item.orderStatus);
    const statusIcon = getStatusIcon(item.orderStatus);


    return (
      <TouchableOpacity
        style={s.orderCard}
        onPress={() =>
          navigation.navigate('OrderTracking', { orderId: item._id })
        }
      >
        {/* Restaurant Info */}
        <View style={s.orderHeader}>
          <Image
            source={{
              uri: item.restaurant?.image || 'https://via.placeholder.com/50',
            }}
            style={s.restaurantImage}
          />
          <View style={s.orderHeaderInfo}>
            <Text style={s.restaurantName}>{item.restaurant?.name}</Text>
            <Text style={s.orderDate}>
              {formatDate(item.orderDate || item.createdAt)}
            </Text>
          </View>
          <StatusBadge status={item.orderStatus} />
        </View>

        {/* Order Items */}
        {item.items && item.items.length > 0 && (
          <View style={s.orderItems}>
            <Text style={s.itemsText}>
              {item.items
                .map((orderItem) => orderItem?.title || orderItem?.food?.title || 'Item')
                .join(', ')}
            </Text>
          </View>
        )}

        {/* Order Footer */}
        <View style={s.orderFooter}>
          <View style={s.orderFooterLeft}>
            <Text style={s.orderIdLabel}>Order #{item.orderId}</Text>
            <Text style={s.orderAmount}>{'PKR ' + String(item.orderAmount.toFixed(2))}</Text>
          </View>
          <View style={s.orderFooterRight}>
            <Text style={[s.statusText, { color: statusColor }]}>
              {item.orderStatus.charAt(0).toUpperCase() + item.orderStatus.slice(1)}
            </Text>
            <Icon name="chevron-right" size={20} color={colors.textSecondary} />
          </View>
        </View>

        {/* Action Buttons */}
        {item.orderStatus === 'delivered' && (
          <View style={s.actionButtons}>
            <TouchableOpacity
              style={s.actionButton}
              onPress={() =>
                navigation.navigate('RateOrder', { orderId: item._id })
              }
            >
              <Icon name="star-outline" size={18} color={colors.accent} />
              <Text style={s.actionButtonText}>Rate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.actionButton}
              onPress={() => {
                // Reorder functionality
              }}
            >
              <Icon name="refresh" size={18} color={colors.accent} />
              <Text style={s.actionButtonText}>Reorder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionButton}>
              <Icon name="receipt" size={18} color={colors.accent} />
              <Text style={s.actionButtonText}>Receipt</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const s = styles(colors, typography, scale);

  if (loading && !data) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>My Orders</Text>
        <TouchableOpacity
          style={s.searchButton}
          onPress={() => navigation.navigate('SearchOrders')}
        >
          <Icon name="magnify" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={s.filterContainer}>
        <FlatList
          horizontal
          data={ORDER_FILTERS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                s.filterTab,
                selectedFilter === item.key && s.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(item.key)}
            >
              <Text
                style={[
                  s.filterTabText,
                  selectedFilter === item.key && s.filterTabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <View style={s.emptyContainer}>
          <Icon name="receipt" size={80} color={colors.border} />
          <Text style={s.emptyTitle}>No orders found</Text>
          <Text style={s.emptySubtitle}>
            {selectedFilter === 'all'
              ? 'Start ordering to see your orders here'
              : `No ${selectedFilter} orders`}
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
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              colors={[colors.accent]}
              tintColor={colors.accent}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Math.round(20 * scale),
    paddingVertical: Math.round(16 * scale),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  searchButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: colors.surface,
    paddingVertical: Math.round(12 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterContent: {
    paddingHorizontal: Math.round(20 * scale),
  },
  filterTab: {
    paddingHorizontal: Math.round(20 * scale),
    paddingVertical: Math.round(8 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.surface,
    marginRight: Math.round(12 * scale),
  },
  filterTabActive: {
    backgroundColor: colors.accent,
  },
  filterTabText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.textInverse,
  },
  listContent: {
    padding: Math.round(20 * scale),
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
    marginBottom: Math.round(16 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(12 * scale),
  },
  restaurantImage: {
    width: Math.round(50 * scale),
    height: Math.round(50 * scale),
    borderRadius: Math.round(8 * scale),
    backgroundColor: colors.border,
  },
  orderHeaderInfo: {
    flex: 1,
    marginLeft: Math.round(12 * scale),
  },
  restaurantName: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  orderDate: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },

  orderItems: {
    paddingVertical: Math.round(12 * scale),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  itemsText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    lineHeight: 20,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Math.round(12 * scale),
  },
  orderFooterLeft: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginBottom: Math.round(4 * scale),
  },
  orderAmount: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  orderFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    marginRight: Math.round(4 * scale),
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: Math.round(12 * scale),
    paddingTop: Math.round(12 * scale),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.round(8 * scale),
    borderRadius: Math.round(8 * scale),
    backgroundColor: colors.accentSurface,
    marginHorizontal: Math.round(4 * scale),
  },
  actionButtonText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.accent,
    marginLeft: Math.round(6 * scale),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Math.round(40 * scale),
  },
  emptyTitle: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: Math.round(24 * scale),
  },
  emptySubtitle: {
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(8 * scale),
    marginBottom: Math.round(32 * scale),
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: Math.round(32 * scale),
    paddingVertical: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
  },
  browseButtonText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textInverse,
  },
});

export default OrdersScreen;
