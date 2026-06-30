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
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const PaymentScreen = ({ route, navigation }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
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
        <View style={s.statusContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={s.statusTitle}>Verifying Payment...</Text>
          <Text style={s.statusMessage}>
            Please wait while we confirm your payment
          </Text>
        </View>
      );
    }

    if (paymentStatus === 'success') {
      return (
        <View style={s.statusContainer}>
          <View style={s.successIcon}>
            <Icon name="check-circle" size={80} color={colors.success} />
          </View>
          <Text style={s.statusTitle}>Payment Successful!</Text>
          <Text style={s.statusMessage}>
            Your order has been placed successfully
          </Text>
          <Text style={s.amountText}>PKR {orderAmount.toFixed(2)}</Text>
          <Text style={s.refText}>Ref: {txRef}</Text>
        </View>
      );
    }

    if (paymentStatus === 'failed') {
      return (
        <View style={s.statusContainer}>
          <View style={s.errorIcon}>
            <Icon name="close-circle" size={80} color={colors.error} />
          </View>
          <Text style={s.statusTitle}>Payment Failed</Text>
          <Text style={s.statusMessage}>
            We couldn't verify your payment. Please try again.
          </Text>
          <View style={s.buttonContainer}>
            <TouchableOpacity
              style={s.retryButton}
              onPress={handleRetry}
            >
              <Icon name="refresh" size={20} color={colors.textInverse} />
              <Text style={s.retryButtonText}>Retry Verification</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.cancelButton}
              onPress={handleCancel}
            >
              <Text style={s.cancelButtonText}>Cancel Order</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return null;
  };

  const s = styles(colors, typography, scale);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Payment Status</Text>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: Math.round(20 * scale),
    paddingVertical: Math.round(16 * scale),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Math.round(20 * scale),
  },
  successIcon: {
    marginBottom: Math.round(24 * scale),
  },
  errorIcon: {
    marginBottom: Math.round(24 * scale),
  },
  statusTitle: {
    fontSize: Math.round(24 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(12 * scale),
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: Math.round(16 * scale),
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Math.round(24 * scale),
  },
  amountText: {
    fontSize: Math.round(32 * scale),
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: Math.round(8 * scale),
  },
  refText: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    marginTop: Math.round(24 * scale),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
    marginBottom: Math.round(12 * scale),
  },
  retryButtonText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.textInverse,
    marginLeft: Math.round(8 * scale),
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Math.round(16 * scale),
  },
  cancelButtonText: {
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
    color: colors.error,
  },
});

export default PaymentScreen;
