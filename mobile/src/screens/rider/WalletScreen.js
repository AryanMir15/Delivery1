import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

import { useTheme, getStatusColor } from '../../theme';
import useResponsive from '../../hooks/useResponsive';

const WalletScreen = () => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const user = useSelector((state) => state.auth.user);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'day', 'week', 'month'

  // Mock data - replace with real data from backend
  const walletData = {
    balance: 2450.00,
    pendingBalance: 350.00,
    dailyEarnings: 450.00,
    weeklyEarnings: 2450.00,
    monthlyEarnings: 8750.00,
    completedOrders: 24,
    totalDistance: 145.5,
  };

  const recentTransactions = [
    { id: 1, type: 'earning', amount: 125.00, orderId: 'ORD-000019', date: '2024-01-15 14:30', status: 'completed' },
    { id: 2, type: 'earning', amount: 95.50, orderId: 'ORD-000018', date: '2024-01-15 12:15', status: 'completed' },
    { id: 3, type: 'withdrawal', amount: -500.00, date: '2024-01-14 10:00', status: 'completed' },
    { id: 4, type: 'earning', amount: 180.00, orderId: 'ORD-000016', date: '2024-01-14 16:45', status: 'completed' },
  ];

  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Funds',
      `Available balance: PKR ${walletData.balance.toFixed(2)}\n\nMinimum withdrawal: PKR 500.00`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: () => {
            if (walletData.balance < 500) {
              Alert.alert('Insufficient Balance', 'Minimum withdrawal amount is PKR 500.00');
            } else {
              Alert.alert('Success', 'Withdrawal request submitted. Funds will be transferred within 24 hours.');
            }
          },
        },
      ]
    );
  };

  const s = styles(colors, typography, scale);

  const getEarningsForPeriod = () => {
    switch (selectedPeriod) {
      case 'day':
        return walletData.dailyEarnings;
      case 'week':
        return walletData.weeklyEarnings;
      case 'month':
        return walletData.monthlyEarnings;
      default:
        return walletData.weeklyEarnings;
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Balance Card */}
        <View style={s.balanceCard}>
          <View style={s.balanceHeader}>
            <Icon name="wallet" size={32} color={colors.surface} />
            <Text style={s.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={s.balanceAmount}>PKR {walletData.balance.toFixed(2)}</Text>
          <View style={s.pendingContainer}>
            <Icon name="clock-outline" size={16} color={colors.surface} />
            <Text style={s.pendingText}>
              PKR {walletData.pendingBalance.toFixed(2)} pending
            </Text>
          </View>
          
          <TouchableOpacity style={s.withdrawButton} onPress={handleWithdraw}>
            <Icon name="bank-transfer" size={20} color={colors.accent} />
            <Text style={s.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={s.periodSelector}>
          <TouchableOpacity
            style={[s.periodButton, selectedPeriod === 'day' && s.periodButtonActive]}
            onPress={() => setSelectedPeriod('day')}
          >
            <Text style={[s.periodButtonText, selectedPeriod === 'day' && s.periodButtonTextActive]}>
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.periodButton, selectedPeriod === 'week' && s.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[s.periodButtonText, selectedPeriod === 'week' && s.periodButtonTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.periodButton, selectedPeriod === 'month' && s.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[s.periodButtonText, selectedPeriod === 'month' && s.periodButtonTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Earnings Stats */}
        <View style={s.statsCard}>
          <Text style={s.statsTitle}>Earnings Overview</Text>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>PKR {getEarningsForPeriod().toFixed(2)}</Text>
              <Text style={s.statLabel}>Total Earnings</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>{walletData.completedOrders}</Text>
              <Text style={s.statLabel}>Completed Orders</Text>
            </View>
          </View>
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{walletData.totalDistance.toFixed(1)} km</Text>
              <Text style={s.statLabel}>Distance Traveled</Text>
            </View>
            <View style={s.statItem}>
              <Text style={s.statValue}>
                PKR {(getEarningsForPeriod() / walletData.completedOrders).toFixed(2)}
              </Text>
              <Text style={s.statLabel}>Avg per Order</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={s.transactionsSection}>
          <Text style={s.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={s.transactionItem}>
              <View style={s.transactionLeft}>
                <View
                  style={[
                    s.transactionIcon,
                    { backgroundColor: transaction.type === 'earning' ? `${colors.success}15` : `${colors.warning}15` },
                  ]}
                >
                  <Icon
                    name={transaction.type === 'earning' ? 'cash-plus' : 'bank-transfer-out'}
                    size={24}
                    color={transaction.type === 'earning' ? colors.accent : colors.warning}
                  />
                </View>
                <View style={s.transactionDetails}>
                  <Text style={s.transactionTitle}>
                    {transaction.type === 'earning' ? `Order ${transaction.orderId}` : 'Withdrawal'}
                  </Text>
                  <Text style={s.transactionDate}>{transaction.date}</Text>
                </View>
              </View>
              <Text
                style={[
                  s.transactionAmount,
                  { color: transaction.type === 'earning' ? colors.accent : colors.error },
                ]}
              >
                {transaction.type === 'earning' ? '+' : ''}PKR {Math.abs(transaction.amount).toFixed(2)}
              </Text>
            </View>
          ))}
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
    padding: Math.round(20 * scale),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  content: {
    padding: Math.round(15 * scale),
  },
  balanceCard: {
    backgroundColor: colors.accent,
    borderRadius: Math.round(16 * scale),
    padding: Math.round(25 * scale),
    marginBottom: Math.round(20 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: Math.round(4 * scale) },
    shadowOpacity: 0.2,
    shadowRadius: Math.round(8 * scale),
    elevation: 5,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(10 * scale),
  },
  balanceLabel: {
    fontSize: Math.round(16 * scale),
    color: colors.surface,
    marginLeft: Math.round(10 * scale),
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: Math.round(42 * scale),
    fontWeight: 'bold',
    color: colors.surface,
    marginVertical: Math.round(10 * scale),
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Math.round(20 * scale),
  },
  pendingText: {
    fontSize: Math.round(14 * scale),
    color: colors.surface,
    marginLeft: Math.round(5 * scale),
    opacity: 0.8,
  },
  withdrawButton: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.round(12 * scale),
    borderRadius: Math.round(10 * scale),
  },
  withdrawButtonText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.accent,
    marginLeft: Math.round(8 * scale),
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(4 * scale),
    marginBottom: Math.round(20 * scale),
  },
  periodButton: {
    flex: 1,
    paddingVertical: Math.round(10 * scale),
    alignItems: 'center',
    borderRadius: Math.round(8 * scale),
  },
  periodButtonActive: {
    backgroundColor: colors.accent,
  },
  periodButtonText: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.surface,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(20 * scale),
    marginBottom: Math.round(20 * scale),
  },
  statsTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(15 * scale),
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Math.round(15 * scale),
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: Math.round(20 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(5 * scale),
  },
  statLabel: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  transactionsSection: {
    marginBottom: Math.round(20 * scale),
  },
  sectionTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(15 * scale),
  },
  transactionItem: {
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    padding: Math.round(15 * scale),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Math.round(10 * scale),
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: Math.round(48 * scale),
    height: Math.round(48 * scale),
    borderRadius: Math.round(24 * scale),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Math.round(12 * scale),
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(4 * scale),
  },
  transactionDate: {
    fontSize: Math.round(12 * scale),
    color: colors.textSecondary,
  },
  transactionAmount: {
    fontSize: Math.round(16 * scale),
    fontWeight: 'bold',
  },
});

export default WalletScreen;
