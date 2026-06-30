import React, { useState } from 'react';
import { View, StyleSheet, Alert, Linking } from 'react-native';
import { Button, ActivityIndicator, Text } from 'react-native-paper';
import { useMutation } from '@apollo/client';
import { INITIALIZE_PAYMENT, VERIFY_PAYMENT } from '../api/mutations';
import { useTheme } from '../theme';

const ChapaPayment = ({ orderId, amount, onSuccess, onError }) => {
  const { colors, typography } = useTheme();
  const [loading, setLoading] = useState(false);
  const [txRef, setTxRef] = useState(null);

  const [initializePayment] = useMutation(INITIALIZE_PAYMENT);
  const [verifyPayment] = useMutation(VERIFY_PAYMENT);

  const handlePayment = async () => {
    try {
      setLoading(true);

      // Initialize payment
      const { data } = await initializePayment({
        variables: {
          orderId,
          paymentMethod: 'chapa',
          returnUrl: 'myapp://payment/success',
          callbackUrl: 'myapp://payment/callback'
        }
      });

      if (!data.initializePayment.success) {
        throw new Error(data.initializePayment.error || 'Payment initialization failed');
      }

      const { checkoutUrl, txRef: transactionRef } = data.initializePayment;
      setTxRef(transactionRef);

      // Open Chapa checkout in browser
      const supported = await Linking.canOpenURL(checkoutUrl);
      if (supported) {
        await Linking.openURL(checkoutUrl);
        
        // Show verification dialog after user returns
        Alert.alert(
          'Payment Verification',
          'Have you completed the payment?',
          [
            {
              text: 'Yes, Verify',
              onPress: () => handleVerifyPayment(transactionRef)
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setLoading(false)
            }
          ]
        );
      } else {
        throw new Error('Cannot open payment URL');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setLoading(false);
      Alert.alert('Payment Error', error.message);
      if (onError) onError(error);
    }
  };

  const handleVerifyPayment = async (transactionRef) => {
    try {
      const { data } = await verifyPayment({
        variables: { txRef: transactionRef }
      });

      if (!data.verifyPayment.success) {
        throw new Error(data.verifyPayment.error || 'Payment verification failed');
      }

      const { status } = data.verifyPayment;

      if (status === 'paid') {
        Alert.alert('Success', 'Payment completed successfully!');
        if (onSuccess) onSuccess(data.verifyPayment);
      } else {
        Alert.alert('Payment Status', `Payment status: ${status}`);
      }

      setLoading(false);
    } catch (error) {
      console.error('Verification error:', error);
      setLoading(false);
      Alert.alert('Verification Error', error.message);
      if (onError) onError(error);
    }
  };

  const styles = (colors, typography) => StyleSheet.create({
    container: {
      marginVertical: 10,
    },
    button: {
      borderRadius: 8,
    },
    buttonContent: {
      paddingVertical: 8,
    },
    loadingText: {
      textAlign: 'center',
      marginTop: 10,
      color: colors.textTertiary,
    },
  });

  const s = styles(colors, typography);

  return (
    <View style={s.container}>
      <Button
        mode="contained"
        onPress={handlePayment}
        disabled={loading}
        style={s.button}
        contentStyle={s.buttonContent}
      >
        {loading ? (
          <ActivityIndicator color={colors.textInverse} />
        ) : (
          `Pay PKR ${amount.toFixed(2)} with Chapa`
        )}
      </Button>
      {loading && (
        <Text style={s.loadingText}>
          Processing payment...
        </Text>
      )}
    </View>
  );
};

export default ChapaPayment;
