import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useQuery } from '@apollo/client';

import { GET_RIDER_ORDERS } from '../../api/queries';

const EarningsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, all
  const [refreshing, setRefreshing] = useState(false);

  const { data, loading, refetch } = useQuery(GET_RIDER_ORDERS, {
    fetchPolicy: 'cache-and-network',
  });

  const orders = data?.ordersByRider || [];

  const onRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const calculateEarnings = (order) => {
    return (order.deliveryCharges || 0) + (order.tipping || 0);
  };

  const getFilteredOrders = () => {
    const now = new Date();
    const deliveredOrders = orders.filter((o) => o.orderStatus === 'delivered');

    switch (selectedPeriod) {
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return deliveredOrders.filter((o) => new Date(o.deliveredAt || o.orderDate) >= weekAgo);
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return deliveredOrders.filter((o) => new Date(o.deliveredAt || o.orderDate) >= monthAgo);
      }
      default:
        return deliveredOrders;
    }
  };

  const filteredOrders = getFilteredOrders();

  const totalEarnings = filteredOrders.reduce((sum, order) => sum + calculateEarnings(order), 0);

  const totalDeliveries = filteredOrders.length;

  const totalTips = filteredOrders.reduce((sum, order) => sum + (order.tipping || 0), 0);

  const averageEarning = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

  const todayOrders = orders.filter((o) => {
    const orderDate = new Date(o.orderDate);
    const today = new Date();
    return (
      orderDate.toDateString() === today.toDateString() && o.orderStatus === 'delivered'
    );
  });

  const todayEarnings = todayOrders.reduce((sum, order) => sum + calculateEarnings(order), 0);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      default:
        return 'All Time';
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Just now';
    
    // Handle both timestamp (number) and ISO string
    const date = new Date(typeof dateValue === 'string' ? dateValue : parseInt(dateValue));
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Just now';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderPeriodButton = (period, label) => (
    <TouchableOpacity
      style={[styles.periodButton, selectedPeriod === period && styles.periodButtonActive]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text
        style={[
          styles.periodButtonText,
          selectedPeriod === period && styles.periodButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEarningItem = ({ item }) => {
    const earnings = calculateEarnings(item);

    return (
      <View style={styles.earningCard}>
        <View style={styles.earningHeader}>
          <View style={styles.earningInfo}>
            <Text style={styles.earningOrderId}>Order #{item.orderId}</Text>
            <Text style={styles.earningDate}>{formatDate(item.deliveredAt || item.orderDate)}</Text>
          </View>
          <View style={styles.earningAmountContainer}>
            <Text style={styles.earningAmount}>ETB {earnings.toFixed(2)}</Text>
            {item.tipping > 0 && (
              <View style={styles.tipBadge}>
                <Icon name="cash-plus" size={12} color="#28A745" />
                <Text style={styles.tipText}>+{item.tipping.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.earningDetails}>
          <View style={styles.earningDetailRow}>
            <Icon name="store" size={14} color="#6C757D" />
            <Text style={styles.earningDetailText}>{item.restaurant?.name}</Text>
          </View>
          <View style={styles.earningDetailRow}>
            <Icon name="map-marker" size={14} color="#6C757D" />
            <Text style={styles.earningDetailText} numberOfLines={1}>
              {item.deliveryAddress?.deliveryAddress}
            </Text>
          </View>
        </View>

        <View style={styles.earningBreakdown}>
          <View style={styles.breakdownItem}>
            <Text style={styles.breakdownLabel}>Delivery Fee</Text>
            <Text style={styles.breakdownValue}>ETB {item.deliveryCharges?.toFixed(2)}</Text>
          </View>
          {item.tipping > 0 && (
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Tip</Text>
              <Text style={[styles.breakdownValue, styles.tipValue]}>
                ETB {item.tipping.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>Track your delivery income</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2EC4B6']} />
        }
      >
        {/* Total Earnings Card */}
        <View style={styles.totalCard}>
          <Icon name="cash-multiple" size={40} color="#FFFFFF" />
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <Text style={styles.totalAmount}>ETB {totalEarnings.toFixed(2)}</Text>
          <Text style={styles.totalSubtext}>{getPeriodLabel()}</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodContainer}>
          {renderPeriodButton('week', 'Week')}
          {renderPeriodButton('month', 'Month')}
          {renderPeriodButton('all', 'All Time')}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="bike-fast" size={28} color="#2EC4B6" />
            <Text style={styles.statValue}>{totalDeliveries}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="cash" size={28} color="#2EC4B6" />
            <Text style={styles.statValue}>ETB {averageEarning.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Avg/Order</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="cash-plus" size={28} color="#28A745" />
            <Text style={styles.statValue}>ETB {totalTips.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Tips</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="calendar-today" size={28} color="#FF6B35" />
            <Text style={styles.statValue}>ETB {todayEarnings.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        {/* Earnings Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelContainer}>
                <Icon name="truck-delivery" size={20} color="#2EC4B6" />
                <Text style={styles.breakdownRowLabel}>Delivery Fees</Text>
              </View>
              <Text style={styles.breakdownRowValue}>
                ETB {(totalEarnings - totalTips).toFixed(2)}
              </Text>
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelContainer}>
                <Icon name="cash-plus" size={20} color="#28A745" />
                <Text style={styles.breakdownRowLabel}>Tips</Text>
              </View>
              <Text style={[styles.breakdownRowValue, styles.tipValue]}>
                ETB {totalTips.toFixed(2)}
              </Text>
            </View>

            <View style={styles.breakdownDivider} />

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLabelContainer}>
                <Icon name="wallet" size={20} color="#1D3557" />
                <Text style={[styles.breakdownRowLabel, styles.totalLabel]}>Total</Text>
              </View>
              <Text style={[styles.breakdownRowValue, styles.totalValue]}>
                ETB {totalEarnings.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Earnings List */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Earnings</Text>
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="cash-remove" size={60} color="#A8DADC" />
              <Text style={styles.emptyText}>No earnings yet</Text>
              <Text style={styles.emptySubtext}>
                Complete deliveries to start earning money
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredOrders.slice(0, 10)}
              keyExtractor={(item) => item.id || item._id}
              renderItem={renderEarningItem}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  subtitle: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 4,
  },
  totalCard: {
    backgroundColor: '#2EC4B6',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  totalLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 12,
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 8,
  },
  totalSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#2EC4B6',
    borderColor: '#2EC4B6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
    marginTop: 4,
  },
  breakdownSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 12,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  breakdownLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownRowLabel: {
    fontSize: 15,
    color: '#495057',
    marginLeft: 12,
  },
  breakdownRowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: '#E9ECEF',
  },
  tipValue: {
    color: '#28A745',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2EC4B6',
  },
  recentSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
  },
  earningCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  earningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  earningInfo: {
    flex: 1,
  },
  earningOrderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  earningDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  earningAmountContainer: {
    alignItems: 'flex-end',
  },
  earningAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2EC4B6',
    marginBottom: 4,
  },
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4EDDA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#28A745',
    marginLeft: 4,
  },
  earningDetails: {
    marginBottom: 12,
  },
  earningDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  earningDetailText: {
    fontSize: 13,
    color: '#6C757D',
    marginLeft: 8,
    flex: 1,
  },
  earningBreakdown: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#495057',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6C757D',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default EarningsScreen;
