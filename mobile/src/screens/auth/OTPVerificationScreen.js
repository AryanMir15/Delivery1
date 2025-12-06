import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useMutation } from '@apollo/client';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { VERIFY_OTP, SEND_OTP_EMAIL, SEND_OTP_PHONE, REGISTER_USER } from '../../api/mutations';
import { loginSuccess, setAuthToken, loginStart } from '../../store/authSlice';

const OTPVerificationScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { email, phone, userData, fromRegistration } = route.params || {};
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  const [registerMutation, { loading: registerLoading }] = useMutation(REGISTER_USER, {
    onCompleted: async (data) => {
      if (data.register) {
        const { token, userId, name, email, phone, picture, isActive } = data.register;
        await AsyncStorage.setItem('authToken', token);
        dispatch(setAuthToken(token));
        dispatch(
          loginSuccess({
            user: {
              id: userId,
              name,
              email,
              phone,
              profileImage: picture,
              isActive,
            },
            token,
          })
        );
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Home') },
        ]);
      }
    },
    onError: (error) => {
      Alert.alert('Registration Failed', error.message);
    },
  });

  const [verifyOtpMutation, { loading }] = useMutation(VERIFY_OTP, {
    onCompleted: async (data) => {
      if (data.verifyOtp.result) {
        // OTP verified successfully
        if (fromRegistration && userData) {
          // Complete registration after OTP verification
          dispatch(loginStart());
          registerMutation({
            variables: {
              name: userData.name.trim(),
              email: userData.email.trim().toLowerCase(),
              phone: userData.phone.trim(),
              password: userData.password,
              role: 'customer',
            },
          });
        } else if (userData) {
          await AsyncStorage.setItem('authToken', userData.token);
          dispatch(setAuthToken(userData.token));
          dispatch(loginSuccess({
            user: userData.user,
            token: userData.token,
          }));
          Alert.alert('Success', 'Verification successful!');
        }
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const [resendOtpEmail] = useMutation(SEND_OTP_EMAIL);
  const [resendOtpPhone] = useMutation(SEND_OTP_PHONE);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (otpCode = otp.join('')) => {
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    verifyOtpMutation({
      variables: {
        otp: otpCode,
        email: email || undefined,
        phone: phone || undefined,
      },
    });
  };

  const handleResend = () => {
    if (!canResend) return;

    if (email) {
      resendOtpEmail({ variables: { email } });
    } else if (phone) {
      resendOtpPhone({ variables: { phone } });
    }

    setTimer(60);
    setCanResend(false);
    setOtp(['', '', '', '', '', '']);
    Alert.alert('Success', 'OTP has been resent!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#1D3557" />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icon name="shield-check-outline" size={80} color="#FF6B35" />
          </View>

          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to{'\n'}
            <Text style={styles.contact}>{email || phone}</Text>
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, (loading || registerLoading) && styles.verifyButtonDisabled]}
            onPress={() => handleVerify()}
            disabled={loading || registerLoading || otp.some((digit) => !digit)}
          >
            {(loading || registerLoading) ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>
                {fromRegistration ? 'Verify & Create Account' : 'Verify'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                Resend code in {timer}s
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginLeft: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D3557',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  contact: {
    fontWeight: '600',
    color: '#1D3557',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 50,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E9ECEF',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1D3557',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF3E0',
  },
  verifyButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
  },
  timerText: {
    fontSize: 16,
    color: '#6C757D',
  },
});

export default OTPVerificationScreen;
