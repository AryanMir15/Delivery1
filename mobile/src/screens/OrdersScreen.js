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

const ORDER_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'picked', label: 'In Transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const OrdersScreen = ({ navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const { data, loading, refetch, error } = useQuery(GET_ORDERS_BY_USER, {
    fetchPolicy: 'network-only',
  });

  const orders = data?.ordersByUser || [];

  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === 'all') return true;
    return order.orderStatus === selectedFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFC107';
      case 'accepted':
        return '#2196F3';
      case 'assigned':
        return '#9C27B0';
      case 'picked':
        return '#FF9800';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#E63946';
      default:
        return '#6C757D';
    }
  };

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
    const statusColor = getStatusColor(item.orderStatus);
    const statusIcon = getStatusIcon(item.orderStatus);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() =>
          navigation.navigate('OrderTracking', { orderId: item._id })
        }
      >
        {/* Restaurant Info */}
        <View style={styles.orderHeader}>
          <Image
            source={{
              uri: item.restaurant?.image || 'https://via.placeholder.com/50',
            }}
            style={styles.restaurantImage}
          />
          <View style={styles.orderHeaderInfo}>
            <Text style={styles.restaurantName}>{item.restaurant?.name}</Text>
            <Text style={styles.orderDate}>
              {formatDate(item.orderDate || item.createdAt)}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Icon name={statusIcon} size={16} color="#FFFFFF" />
          </View>
        </View>

        {/* Order Items */}
        {item.items && item.items.length > 0 && (
          <View style={styles.orderItems}>
            <Text style={styles.itemsText}>
              {item.items
                .map((orderItem) => orderItem?.title || orderItem?.food?.title || 'Item')
                .join(', ')}
            </Text>
          </View>
        )}

        {/* Order Footer */}
        <View style={styles.orderFooter}>
          <View style={styles.orderFooterLeft}>
            <Text style={styles.orderIdLabel}>Order #{item.orderId}</Text>
            <Text style={styles.orderAmount}>{'ETB ' + String(item.orderAmount.toFixed(2))}</Text>
          </View>
          <View style={styles.orderFooterRight}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.orderStatus.charAt(0).toUpperCase() + item.orderStatus.slice(1)}
            </Text>
            <Icon name="chevron-right" size={20} color="#6C757D" />
          </View>
        </View>

        {/* Action Buttons */}
        {item.orderStatus === 'delivered' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('RateOrder', { orderId: item._id })
              }
            >
              <Icon name="star-outline" size={18} color="#FF6B35" />
              <Text style={styles.actionButtonText}>Rate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // Reorder functionality
              }}
            >
              <Icon name="refresh" size={18} color="#FF6B35" />
              <Text style={styles.actionButtonText}>Reorder</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="receipt" size={18} color="#FF6B35" />
              <Text style={styles.actionButtonText}>Receipt</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading && !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('SearchOrders')}
        >
          <Icon name="magnify" size={24} color="#1D3557" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={ORDER_FILTERS}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                selectedFilter === item.key && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(item.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === item.key && styles.filterTabTextActive,
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
        <View style={styles.emptyContainer}>
          <Icon name="receipt" size={80} color="#E9ECEF" />
          <Text style={styles.emptyTitle}>No orders found</Text>
          <Text style={styles.emptySubtitle}>
            {selectedFilter === 'all'
              ? 'Start ordering to see your orders here'
              : `No ${selectedFilter} orders`}
          </Text>
          <TouchableOpacity
            style={styles.browseButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.browseButtonText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refetch}
              colors={['#FF6B35']}
              tintColor="#FF6B35"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  filterContent: {
    paddingHorizontal: 20,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    marginRight: 12,
  },
  filterTabActive: {
    backgroundColor: '#FF6B35',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  restaurantImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#E9ECEF',
  },
  orderHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6C757D',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderItems: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E9ECEF',
  },
  itemsText: {
    fontSize: 14,
    color: '#6C757D',
    lineHeight: 20,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  orderFooterLeft: {
    flex: 1,
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 4,
  },
  orderAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  orderFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFF3E0',
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6C757D',
    marginTop: 8,
    marginBottom: 32,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default OrdersScreen;
