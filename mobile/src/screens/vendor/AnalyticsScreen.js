import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useTheme, getStatusColor } from '../../theme';
import useResponsive from '../../hooks/useResponsive';
import OrdersIcon from '../../components/OrdersIcon';

import { GET_ORDERS_BY_RESTAURANT, GET_RESTAURANTS_BY_OWNER } from '../../api/queries';

const screenWidth = Dimensions.get('window').width;

const PERIODS = ['Today', 'Week', 'Month', 'Year'];

const formatHour = (h) => {
  if (h === 0 || h === 24) return '12am';
  if (h === 12) return '12pm';
  return h > 12 ? `${h - 12}pm` : `${h}am`;
};

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('Week');
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();

  const { data: restaurantData } = useQuery(GET_RESTAURANTS_BY_OWNER);
  const selectedRestaurant = restaurantData?.restaurantsByOwner?.[0];

  const { data } = useQuery(GET_ORDERS_BY_RESTAURANT, {
    variables: { restaurant: selectedRestaurant?._id },
    skip: !selectedRestaurant,
  });

  const orders = data?.ordersByRestaurant || [];

  // Filter orders by selected period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    if (selectedPeriod === 'Today') {
      return orders.filter(
        (o) => new Date(o.orderDate).toDateString() === now.toDateString()
      );
    } else if (selectedPeriod === 'Week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orders.filter((o) => new Date(o.orderDate) >= weekAgo);
    } else if (selectedPeriod === 'Month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return orders.filter((o) => new Date(o.orderDate) >= monthAgo);
    }
    return orders;
  }, [orders, selectedPeriod]);

  // Today vs Yesterday comparison
  const comparison = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toDateString();

    const todayOrders = orders.filter(
      (o) => new Date(o.orderDate).toDateString() === todayStr
    );
    const yesterdayOrders = orders.filter(
      (o) => new Date(o.orderDate).toDateString() === yesterdayStr
    );

    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.orderAmount, 0);
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + o.orderAmount, 0);

    const revenueChange = yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(0)
      : null;
    const orderChange = yesterdayOrders.length > 0
      ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length * 100).toFixed(0)
      : null;

    return {
      todayRevenue,
      todayCount: todayOrders.length,
      revenueChange: revenueChange !== null ? Number(revenueChange) : null,
      orderChange: orderChange !== null ? Number(orderChange) : null,
    };
  }, [orders]);

  // Peak hours
  const peakHours = useMemo(() => {
    if (filteredOrders.length === 0) return null;
    const hourCounts = {};
    filteredOrders.forEach((o) => {
      const h = new Date(o.orderDate).getHours();
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    const sorted = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    const topHour = Number(sorted[0][0]);
    const topCount = sorted[0][1];
    return { hour: topHour, count: topCount };
  }, [filteredOrders]);

  // Top selling items
  const topItems = useMemo(() => {
    if (filteredOrders.length === 0) return [];
    const itemCounts = {};
    filteredOrders.forEach((order) => {
      if (order.items) {
        order.items.forEach((item) => {
          const name = item.title || item.food?.title || 'Item';
          itemCounts[name] = (itemCounts[name] || 0) + (item.quantity || 1);
        });
      }
    });
    return Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [filteredOrders]);

  // Stats
  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.orderAmount, 0);
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(
      (o) => o.orderStatus === 'delivered'
    ).length;
    const cancelledOrders = filteredOrders.filter(
      (o) => o.orderStatus === 'cancelled'
    ).length;
    return { totalRevenue, totalOrders, completedOrders, cancelledOrders };
  }, [filteredOrders]);

  // Chart data
  const getRevenueChartData = () => {
    const labels = [];
    const data = [];

    if (selectedPeriod === 'Week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        const dayRevenue = orders
          .filter(
            (o) =>
              new Date(o.orderDate).toDateString() === date.toDateString() &&
              o.orderStatus === 'delivered'
          )
          .reduce((sum, o) => sum + o.orderAmount, 0);
        data.push(dayRevenue);
      }
    } else {
      labels.push('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');
      data.push(0, 0, 0, 0, 0, 0, 0);
    }

    return { labels, datasets: [{ data }] };
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      const hex = colors.accent.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    labelColor: (opacity = 1) => {
      const hex = colors.textSecondary.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    },
    style: { borderRadius: 12 },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.accent,
    },
  };

  const s = styles(colors, typography, scale);

  const renderComparison = (value) => {
    if (value === null) return null;
    const isUp = value > 0;
    const isDown = value < 0;
    return (
      <View style={[s.changeBadge, isUp && s.changeUp, isDown && s.changeDown]}>
        <Ionicons
          name={isUp ? 'arrow-up' : isDown ? 'arrow-down' : 'remove'}
          size={10}
          color={isUp ? colors.statusDelivered : isDown ? colors.statusCancelled : colors.textTertiary}
        />
        <Text style={[s.changeText, isUp && s.changeTextUp, isDown && s.changeTextDown]}>
          {Math.abs(value)}%
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView style={s.scrollContent} contentContainerStyle={s.scrollInner}>
        {/* Period Selector */}
        <View style={s.periodSelector}>
          {PERIODS.map((period) => (
            <TouchableOpacity
              key={period}
              style={[s.periodButton, selectedPeriod === period && s.periodButtonActive]}
              onPress={() => setSelectedPeriod(period)}
            >
              <Text style={[s.periodButtonText, selectedPeriod === period && s.periodButtonTextActive]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Summary + Comparison */}
        <View style={s.section}>
          <View style={s.summaryRow}>
            <View style={s.summaryCard}>
              <View style={s.summaryHeader}>
                <Text style={s.summaryLabel}>Revenue</Text>
                {renderComparison(comparison.revenueChange)}
              </View>
              <Text style={s.summaryValue}>PKR {comparison.todayRevenue.toFixed(0)}</Text>
            </View>
            <View style={s.summaryCard}>
              <View style={s.summaryHeader}>
                <Text style={s.summaryLabel}>Orders</Text>
                {renderComparison(comparison.orderChange)}
              </View>
              <Text style={s.summaryValue}>{comparison.todayCount}</Text>
            </View>
          </View>
        </View>

        {/* Peak Hours */}
        {peakHours && (
          <View style={s.section}>
            <View style={s.insightCard}>
              <Ionicons name="time-outline" size={18} color={colors.accent} />
              <Text style={s.insightText}>
                Busiest at <Text style={s.insightHighlight}>{formatHour(peakHours.hour)}</Text>
                {' '}— {peakHours.count} order{peakHours.count !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Top Items */}
        {topItems.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Top Items</Text>
            <View style={s.topItemsCard}>
              {topItems.map(([name, count], index) => (
                <View
                  key={name}
                  style={[s.topItem, index < topItems.length - 1 && s.topItemBorder]}
                >
                  <View style={s.topItemRank}>
                    <Text style={s.topItemRankText}>{index + 1}</Text>
                  </View>
                  <Text style={s.topItemName} numberOfLines={1}>{name}</Text>
                  <Text style={s.topItemCount}>{count}x</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Period Stats */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>This {selectedPeriod === 'Today' ? 'Today' : selectedPeriod}</Text>
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <OrdersIcon size={20} color={colors.accent} />
              <Text style={s.statValue}>{stats.totalOrders}</Text>
              <Text style={s.statLabel}>Total</Text>
            </View>
            <View style={[s.statCard, s.statCardCenter]}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.statusDelivered} />
              <Text style={s.statValue}>{stats.completedOrders}</Text>
              <Text style={s.statLabel}>Done</Text>
            </View>
            <View style={s.statCard}>
              <Ionicons name="close-circle-outline" size={20} color={colors.statusCancelled} />
              <Text style={s.statValue}>{stats.cancelledOrders}</Text>
              <Text style={s.statLabel}>Cancelled</Text>
            </View>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Revenue Trend</Text>
          <View style={s.chartContainer}>
            <LineChart
              data={getRevenueChartData()}
              width={screenWidth - 60}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={s.chart}
              withInnerLines={false}
              withOuterLines={true}
            />
          </View>
        </View>

        {/* Status Distribution */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Order Status</Text>
          <View style={s.statusList}>
            {[
              { status: 'delivered', label: 'Delivered' },
              { status: 'pending', label: 'Pending' },
              { status: 'preparing', label: 'Preparing' },
              { status: 'cancelled', label: 'Cancelled' },
            ].map((item) => {
              const count = orders.filter((o) => o.orderStatus === item.status).length;
              const percentage =
                orders.length > 0 ? ((count / orders.length) * 100).toFixed(1) : 0;
              const statusColor = getStatusColor(colors, item.status);

              return (
                <View key={item.status} style={s.statusItem}>
                  <View style={s.statusInfo}>
                    <View style={[s.statusDot, { backgroundColor: statusColor }]} />
                    <Text style={s.statusLabel}>{item.label}</Text>
                  </View>
                  <View style={s.statusStats}>
                    <Text style={s.statusCount}>{count}</Text>
                    <Text style={s.statusPercentage}>({percentage}%)</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: Math.round(40 * scale),
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: Math.round(16 * scale),
    marginTop: Math.round(12 * scale),
    padding: Math.round(4 * scale),
    borderRadius: Math.round(10 * scale),
  },
  periodButton: {
    flex: 1,
    paddingVertical: Math.round(10 * scale),
    borderRadius: Math.round(8 * scale),
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.accent,
  },
  periodButtonText: {
    fontSize: Math.round(13 * scale),
    color: colors.textSecondary,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: colors.textInverse,
  },
  section: {
    paddingHorizontal: Math.round(16 * scale),
    marginTop: Math.round(16 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(15 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(10 * scale),
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Math.round(10 * scale),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: Math.round(6 * scale),
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Math.round(6 * scale),
    paddingVertical: Math.round(2 * scale),
    borderRadius: Math.round(6 * scale),
    gap: Math.round(2 * scale),
  },
  changeUp: {
    backgroundColor: `${colors.statusDelivered}18`,
  },
  changeDown: {
    backgroundColor: `${colors.statusCancelled}18`,
  },
  changeText: {
    fontSize: Math.round(11 * scale),
    fontWeight: '600',
    color: colors.textTertiary,
  },
  changeTextUp: {
    color: colors.statusDelivered,
  },
  changeTextDown: {
    color: colors.statusCancelled,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: Math.round(14 * scale),
    borderRadius: Math.round(12 * scale),
    gap: Math.round(10 * scale),
  },
  insightText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    flex: 1,
  },
  insightHighlight: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  topItemsCard: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    overflow: 'hidden',
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Math.round(14 * scale),
    gap: Math.round(12 * scale),
  },
  topItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topItemRank: {
    width: Math.round(24 * scale),
    height: Math.round(24 * scale),
    borderRadius: Math.round(12 * scale),
    backgroundColor: colors.surfaceVariant,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topItemRankText: {
    fontSize: Math.round(12 * scale),
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  topItemName: {
    flex: 1,
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
  },
  topItemCount: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.accent,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Math.round(10 * scale),
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: Math.round(14 * scale),
    borderRadius: Math.round(12 * scale),
    alignItems: 'center',
  },
  statCardCenter: {
    borderTopWidth: 2,
    borderTopColor: colors.statusDelivered,
  },
  statValue: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: Math.round(6 * scale),
  },
  statLabel: {
    fontSize: Math.round(10 * scale),
    color: colors.textSecondary,
    marginTop: Math.round(3 * scale),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(8 * scale),
  },
  chart: {
    borderRadius: Math.round(12 * scale),
  },
  statusList: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(16 * scale),
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Math.round(10 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: Math.round(8 * scale),
    height: Math.round(8 * scale),
    borderRadius: Math.round(4 * scale),
    marginRight: Math.round(10 * scale),
  },
  statusLabel: {
    fontSize: Math.round(14 * scale),
    color: colors.textPrimary,
  },
  statusStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Math.round(6 * scale),
  },
  statusCount: {
    fontSize: Math.round(15 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statusPercentage: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
});
