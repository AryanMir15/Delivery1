import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useMutation } from '@apollo/client';
import { VERIFY_PAYMENT } from '../api/mutations';
import chapaService from '../services/chapaService';

const PaymentScreen = ({ route, navigation }) => {
  const { txRef, orderId, orderAmount } = route.params;
  const [verifying, setVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const [verifyPaymentMutation] = useMutation(VERIFY_PAYMENT, {
    onCompleted: (data) => {
      setVerifying(false);
      if (data.verifyPayment.success) {
        setPaymentStatus('success');
        setTimeout(() => {
          navigation.replace('OrderTracking', { orderId });
        }, 2000);
      } else {
        setPaymentStatus('failed');
      }
    },
    onError: (error) => {
      setVerifying(false);
      setPaymentStatus('failed');
      console.error('Payment verification error:', error);
    },
  });

  useEffect(() => {
    // Verify payment when screen loads
    verifyPayment();
  }, []);

  const verifyPayment = () => {
    setVerifying(true);
    verifyPaymentMutation({
      variables: { txRef },
    });
  };

  const handleRetry = () => {
    verifyPayment();
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel this payment? Your order will not be processed.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            chapaService.reset();
            navigation.navigate('MyOrders');
          },
        },
      ]
    );
  };

  const renderContent = () => {
    if (verifying) {
      return (
        <View style={styles.statusContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.statusTitle}>Verifying Payment...</Text>
          <Text style={styles.statusMessage}>
            Please wait while we confirm your payment
          </Text>
        </View>
      );
    }

    if (paymentStatus === 'success') {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.successIcon}>
            <Icon name="check-circle" size={80} color="#4CAF50" />
          </View>
          <Text style={styles.statusTitle}>Payment Successful!</Text>
          <Text style={styles.statusMessage}>
            Your order has been placed successfully
          </Text>
          <Text style={styles.amountText}>ETB {orderAmount.toFixed(2)}</Text>
          <Text style={styles.refText}>Ref: {txRef}</Text>
        </View>
      );
    }

    if (paymentStatus === 'failed') {
      return (
        <View style={styles.statusContainer}>
          <View style={styles.errorIcon}>
            <Icon name="close-circle" size={80} color="#F44336" />
          </View>
          <Text style={styles.statusTitle}>Payment Failed</Text>
          <Text style={styles.statusMessage}>
            We couldn't verify your payment. Please try again.
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
            >
              <Icon name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry Verification</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payment Status</Text>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    marginBottom: 24,
  },
  errorIcon: {
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    marginBottom: 24,
  },
  amountText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  refText: {
    fontSize: 14,
    color: '#6C757D',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
});

export default PaymentScreen;
