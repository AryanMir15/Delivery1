import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

const WalletScreen = () => {
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
      `Available balance: ETB ${walletData.balance.toFixed(2)}\n\nMinimum withdrawal: ETB 500.00`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          onPress: () => {
            if (walletData.balance < 500) {
              Alert.alert('Insufficient Balance', 'Minimum withdrawal amount is ETB 500.00');
            } else {
              Alert.alert('Success', 'Withdrawal request submitted. Funds will be transferred within 24 hours.');
            }
          },
        },
      ]
    );
  };

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Icon name="wallet" size={32} color="#FFFFFF" />
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>ETB {walletData.balance.toFixed(2)}</Text>
          <View style={styles.pendingContainer}>
            <Icon name="clock-outline" size={16} color="#FFFFFF" />
            <Text style={styles.pendingText}>
              ETB {walletData.pendingBalance.toFixed(2)} pending
            </Text>
          </View>
          
          <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
            <Icon name="bank-transfer" size={20} color="#2EC4B6" />
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'day' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('day')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'day' && styles.periodButtonTextActive]}>
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Earnings Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Earnings Overview</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>ETB {getEarningsForPeriod().toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Earnings</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{walletData.completedOrders}</Text>
              <Text style={styles.statLabel}>Completed Orders</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{walletData.totalDistance.toFixed(1)} km</Text>
              <Text style={styles.statLabel}>Distance Traveled</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                ETB {(getEarningsForPeriod() / walletData.completedOrders).toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Avg per Order</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View
                  style={[
                    styles.transactionIcon,
                    { backgroundColor: transaction.type === 'earning' ? '#E8F8F5' : '#FFF3E0' },
                  ]}
                >
                  <Icon
                    name={transaction.type === 'earning' ? 'cash-plus' : 'bank-transfer-out'}
                    size={24}
                    color={transaction.type === 'earning' ? '#28A745' : '#FF9800'}
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>
                    {transaction.type === 'earning' ? `Order ${transaction.orderId}` : 'Withdrawal'}
                  </Text>
                  <Text style={styles.transactionDate}>{transaction.date}</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  { color: transaction.type === 'earning' ? '#28A745' : '#E63946' },
                ]}
              >
                {transaction.type === 'earning' ? '+' : ''}ETB {Math.abs(transaction.amount).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  content: {
    padding: 15,
  },
  balanceCard: {
    backgroundColor: '#2EC4B6',
    borderRadius: 16,
    padding: 25,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginLeft: 10,
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginVertical: 10,
  },
  pendingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pendingText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 5,
    opacity: 0.8,
  },
  withdrawButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  withdrawButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2EC4B6',
    marginLeft: 8,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#2EC4B6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6C757D',
  },
  transactionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 15,
  },
  transactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default WalletScreen;
