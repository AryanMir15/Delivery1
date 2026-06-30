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

import { useTheme, getStatusColor } from '../../theme';
import useResponsive from '../../hooks/useResponsive';
import { GET_RIDER_ORDERS } from '../../api/queries';

const EarningsScreen = () => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
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

  const s = styles(colors, typography, scale);

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
      style={[s.periodButton, selectedPeriod === period && s.periodButtonActive]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text
        style={[
          s.periodButtonText,
          selectedPeriod === period && s.periodButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEarningItem = ({ item }) => {
    const earnings = calculateEarnings(item);

    return (
      <View style={s.earningCard}>
        <View style={s.earningHeader}>
          <View style={s.earningInfo}>
            <Text style={s.earningOrderId}>Order #{item.orderId}</Text>
            <Text style={s.earningDate}>{formatDate(item.deliveredAt || item.orderDate)}</Text>
          </View>
          <View style={s.earningAmountContainer}>
            <Text style={s.earningAmount}>PKR {earnings.toFixed(2)}</Text>
            {item.tipping > 0 && (
              <View style={s.tipBadge}>
                <Icon name="cash-plus" size={12} color={colors.accent} />
                <Text style={s.tipText}>+{item.tipping.toFixed(2)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={s.earningDetails}>
          <View style={s.earningDetailRow}>
            <Icon name="store" size={14} color={colors.textSecondary} />
            <Text style={s.earningDetailText}>{item.restaurant?.name}</Text>
          </View>
          <View style={s.earningDetailRow}>
            <Icon name="map-marker" size={14} color={colors.textSecondary} />
            <Text style={s.earningDetailText} numberOfLines={1}>
              {item.deliveryAddress?.deliveryAddress}
            </Text>
          </View>
        </View>

        <View style={s.earningBreakdown}>
          <View style={s.breakdownItem}>
            <Text style={s.breakdownLabel}>Delivery Fee</Text>
            <Text style={s.breakdownValue}>PKR {item.deliveryCharges?.toFixed(2)}</Text>
          </View>
          {item.tipping > 0 && (
            <View style={s.breakdownItem}>
              <Text style={s.breakdownLabel}>Tip</Text>
              <Text style={[s.breakdownValue, s.tipValue]}>
                PKR {item.tipping.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Earnings</Text>
        <Text style={s.subtitle}>Track your delivery income</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} />
        }
      >
        {/* Total Earnings Card */}
        <View style={s.totalCard}>
          <Icon name="cash-multiple" size={40} color={colors.surface} />
          <Text style={s.totalLabel}>Total Earnings</Text>
          <Text style={s.totalAmount}>PKR {totalEarnings.toFixed(2)}</Text>
          <Text style={s.totalSubtext}>{getPeriodLabel()}</Text>
        </View>

        {/* Period Selector */}
        <View style={s.periodContainer}>
          {renderPeriodButton('week', 'Week')}
          {renderPeriodButton('month', 'Month')}
          {renderPeriodButton('all', 'All Time')}
        </View>

        {/* Stats Grid */}
        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <Icon name="bike-fast" size={28} color={colors.accent} />
            <Text style={s.statValue}>{totalDeliveries}</Text>
            <Text style={s.statLabel}>Deliveries</Text>
          </View>

          <View style={s.statCard}>
            <Icon name="cash" size={28} color={colors.accent} />
            <Text style={s.statValue}>PKR {averageEarning.toFixed(0)}</Text>
            <Text style={s.statLabel}>Avg/Order</Text>
          </View>

          <View style={s.statCard}>
            <Icon name="cash-plus" size={28} color={colors.accent} />
            <Text style={s.statValue}>PKR {totalTips.toFixed(0)}</Text>
            <Text style={s.statLabel}>Tips</Text>
          </View>

          <View style={s.statCard}>
            <Icon name="calendar-today" size={28} color={colors.accent} />
            <Text style={s.statValue}>PKR {todayEarnings.toFixed(0)}</Text>
            <Text style={s.statLabel}>Today</Text>
          </View>
        </View>

        {/* Earnings Breakdown */}
        <View style={s.breakdownSection}>
          <Text style={s.sectionTitle}>Earnings Breakdown</Text>
          <View style={s.breakdownCard}>
            <View style={s.breakdownRow}>
              <View style={s.breakdownLabelContainer}>
                <Icon name="truck-delivery" size={20} color={colors.accent} />
                <Text style={s.breakdownRowLabel}>Delivery Fees</Text>
              </View>
              <Text style={s.breakdownRowValue}>
                PKR {(totalEarnings - totalTips).toFixed(2)}
              </Text>
            </View>

            <View style={s.breakdownDivider} />

            <View style={s.breakdownRow}>
              <View style={s.breakdownLabelContainer}>
                <Icon name="cash-plus" size={20} color={colors.accent} />
                <Text style={s.breakdownRowLabel}>Tips</Text>
              </View>
              <Text style={[s.breakdownRowValue, s.tipValue]}>
                PKR {totalTips.toFixed(2)}
              </Text>
            </View>

            <View style={s.breakdownDivider} />

            <View style={s.breakdownRow}>
              <View style={s.breakdownLabelContainer}>
                <Icon name="wallet" size={20} color={colors.textPrimary} />
                <Text style={[s.breakdownRowLabel, s.totalLabel]}>Total</Text>
              </View>
              <Text style={[s.breakdownRowValue, s.totalValue]}>
                PKR {totalEarnings.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Earnings List */}
        <View style={s.recentSection}>
          <Text style={s.sectionTitle}>Recent Earnings</Text>
          {filteredOrders.length === 0 ? (
            <View style={s.emptyContainer}>
              <Icon name="cash-remove" size={60} color={colors.accentLight} />
              <Text style={s.emptyText}>No earnings yet</Text>
              <Text style={s.emptySubtext}>
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

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: Math.round(16 * scale),
    paddingTop: Math.round(16 * scale),
    paddingBottom: Math.round(12 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: Math.round(28 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(4 * scale),
  },
  totalCard: {
    backgroundColor: colors.accent,
    marginHorizontal: Math.round(16 * scale),
    marginTop: Math.round(16 * scale),
    borderRadius: Math.round(16 * scale),
    padding: Math.round(32 * scale),
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(4 * scale) },
    shadowOpacity: 0.2,
    shadowRadius: Math.round(8 * scale),
    elevation: 6,
  },
  totalLabel: {
    fontSize: Math.round(16 * scale),
    color: colors.surface,
    opacity: 0.9,
    marginTop: Math.round(12 * scale),
  },
  totalAmount: {
    fontSize: Math.round(48 * scale),
    fontWeight: 'bold',
    color: colors.surface,
    marginVertical: Math.round(8 * scale),
  },
  totalSubtext: {
    fontSize: Math.round(14 * scale),
    color: colors.surface,
    opacity: 0.8,
  },
  periodContainer: {
    flexDirection: 'row',
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(16 * scale),
    gap: Math.round(8 * scale),
  },
  periodButton: {
    flex: 1,
    paddingVertical: Math.round(10 * scale),
    paddingHorizontal: Math.round(16 * scale),
    borderRadius: Math.round(8 * scale),
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  periodButtonText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.surface,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Math.round(16 * scale),
    gap: Math.round(12 * scale),
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.1,
    shadowRadius: Math.round(4 * scale),
    elevation: 3,
  },
  statValue: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: Math.round(8 * scale),
  },
  statLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(4 * scale),
  },
  breakdownSection: {
    paddingHorizontal: Math.round(16 * scale),
    paddingTop: Math.round(24 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(12 * scale),
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.1,
    shadowRadius: Math.round(4 * scale),
    elevation: 3,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Math.round(12 * scale),
  },
  breakdownLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownRowLabel: {
    fontSize: Math.round(15 * scale),
    color: colors.textPrimary,
    marginLeft: Math.round(12 * scale),
  },
  breakdownRowValue: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  tipValue: {
    color: colors.accent,
  },
  totalValue: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.accent,
  },
  recentSection: {
    paddingHorizontal: Math.round(16 * scale),
    paddingTop: Math.round(24 * scale),
    paddingBottom: Math.round(24 * scale),
  },
  earningCard: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
    marginBottom: Math.round(12 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(2 * scale) },
    shadowOpacity: 0.1,
    shadowRadius: Math.round(4 * scale),
    elevation: 3,
  },
  earningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Math.round(12 * scale),
  },
  earningInfo: {
    flex: 1,
  },
  earningOrderId: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  earningDate: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  earningAmountContainer: {
    alignItems: 'flex-end',
  },
  earningAmount: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: Math.round(4 * scale),
  },
  tipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}20`,
    paddingHorizontal: Math.round(8 * scale),
    paddingVertical: Math.round(2 * scale),
    borderRadius: Math.round(8 * scale),
  },
  tipText: {
    fontSize: Math.round(11 * scale),
    fontWeight: '600',
    color: colors.accent,
    marginLeft: Math.round(4 * scale),
  },
  earningDetails: {
    marginBottom: Math.round(12 * scale),
  },
  earningDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(6 * scale),
  },
  earningDetailText: {
    fontSize: Math.round(13 * scale),
    color: colors.textSecondary,
    marginLeft: Math.round(8 * scale),
    flex: 1,
  },
  earningBreakdown: {
    paddingTop: Math.round(12 * scale),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Math.round(4 * scale),
  },
  breakdownLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontSize: Math.round(12 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Math.round(40 * scale),
    paddingHorizontal: Math.round(32 * scale),
  },
  emptyText: {
    fontSize: Math.round(18 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: Math.round(16 * scale),
  },
  emptySubtext: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(8 * scale),
    textAlign: 'center',
  },
});

export default EarningsScreen;
