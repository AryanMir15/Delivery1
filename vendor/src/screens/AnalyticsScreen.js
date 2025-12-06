import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useQuery } from '@apollo/client';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';

import { GET_ORDERS_BY_RESTAURANT } from '../api/queries';

const screenWidth = Dimensions.get('window').width;

const PERIODS = ['Today', 'Week', 'Month', 'Year'];

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('Week');
  const { selectedRestaurant } = useSelector((state) => state.auth);

  const { data } = useQuery(GET_ORDERS_BY_RESTAURANT, {
    variables: { restaurant: selectedRestaurant?._id },
    skip: !selectedRestaurant,
  });

  const orders = data?.ordersByRestaurant || [];

  // Calculate analytics
  const calculateStats = () => {
    const now = new Date();
    let filteredOrders = orders;

    // Filter by period
    if (selectedPeriod === 'Today') {
      filteredOrders = orders.filter(
        (o) => new Date(o.orderDate).toDateString() === now.toDateString()
      );
    } else if (selectedPeriod === 'Week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter((o) => new Date(o.orderDate) >= weekAgo);
    } else if (selectedPeriod === 'Month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredOrders = orders.filter((o) => new Date(o.orderDate) >= monthAgo);
    }

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.orderAmount, 0);
    const totalOrders = filteredOrders.length;
    const completedOrders = filteredOrders.filter(
      (o) => o.orderStatus === 'delivered'
    ).length;
    const cancelledOrders = filteredOrders.filter(
      (o) => o.orderStatus === 'cancelled'
    ).length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalRevenue,
      totalOrders,
      completedOrders,
      cancelledOrders,
      averageOrderValue,
    };
  };

  const stats = calculateStats();

  // Prepare chart data
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
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#4CAF50',
    },
  };

  return (
    <ScrollView style={styles.container}>
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {PERIODS.map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive,
              ]}
            >
              {period}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Ionicons name="cash" size={32} color="#4CAF50" />
          <Text style={styles.statValue}>ETB {stats.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="receipt" size={32} color="#2196F3" />
          <Text style={styles.statValue}>{stats.totalOrders}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
          <Text style={styles.statValue}>{stats.completedOrders}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="close-circle" size={32} color="#F44336" />
          <Text style={styles.statValue}>{stats.cancelledOrders}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
      </View>

      {/* Average Order Value */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Average Order Value</Text>
        <View style={styles.avgCard}>
          <Text style={styles.avgValue}>
            ETB {stats.averageOrderValue.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Revenue Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Revenue Trend</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={getRevenueChartData()}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </View>

      {/* Order Status Distribution */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Status</Text>
        <View style={styles.statusList}>
          {[
            { status: 'delivered', label: 'Delivered', color: '#4CAF50' },
            { status: 'pending', label: 'Pending', color: '#FF9800' },
            { status: 'preparing', label: 'Preparing', color: '#9C27B0' },
            { status: 'cancelled', label: 'Cancelled', color: '#F44336' },
          ].map((item) => {
            const count = orders.filter((o) => o.orderStatus === item.status).length;
            const percentage =
              orders.length > 0 ? ((count / orders.length) * 100).toFixed(1) : 0;

            return (
              <View key={item.status} style={styles.statusItem}>
                <View style={styles.statusInfo}>
                  <View
                    style={[styles.statusDot, { backgroundColor: item.color }]}
                  />
                  <Text style={styles.statusLabel}>{item.label}</Text>
                </View>
                <View style={styles.statusStats}>
                  <Text style={styles.statusCount}>{count}</Text>
                  <Text style={styles.statusPercentage}>({percentage}%)</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    gap: 10,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  periodButtonActive: {
    backgroundColor: '#4CAF50',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    margin: '1%',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardPrimary: {
    width: '98%',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  avgCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avgValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chart: {
    borderRadius: 10,
  },
  statusList: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusLabel: {
    fontSize: 16,
    color: '#333',
  },
  statusStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusPercentage: {
    fontSize: 14,
    color: '#666',
  },
});
