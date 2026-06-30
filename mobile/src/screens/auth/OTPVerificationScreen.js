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
import { useTheme } from '../../theme';

const OTPVerificationScreen = ({ navigation, route }) => {
  const { colors, typography } = useTheme();
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
        if (fromRegistration && userData) {
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

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

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

  const s = styles(colors, typography);

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.keyboardView}
      >
        <TouchableOpacity
          style={s.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={s.content}>
          <View style={s.iconContainer}>
            <Icon name="shield-check-outline" size={80} color={colors.accent} />
          </View>

          <Text style={s.title}>Verification Code</Text>
          <Text style={s.subtitle}>
            We've sent a 6-digit code to{'\n'}
            <Text style={s.contact}>{email || phone}</Text>
          </Text>

          <View style={s.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  s.otpInput,
                  digit && s.otpInputFilled,
                ]}
                color={colors.textPrimary}
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
            style={[s.verifyButton, (loading || registerLoading) && s.verifyButtonDisabled]}
            onPress={() => handleVerify()}
            disabled={loading || registerLoading || otp.some((digit) => !digit)}
          >
            {(loading || registerLoading) ? (
              <ActivityIndicator color={colors.buttonPrimaryText} />
            ) : (
              <Text style={s.verifyButtonText}>
                {fromRegistration ? 'Verify & Create Account' : 'Verify'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={s.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResend}>
                <Text style={s.resendText}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={s.timerText}>
                Resend code in {timer}s
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = (colors, typography) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
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
    ...typography.h1,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  contact: {
    fontWeight: '600',
    color: colors.textPrimary,
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
    backgroundColor: colors.inputBackground,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceVariant,
  },
  verifyButton: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  verifyButtonDisabled: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '600',
  },
  timerText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default OTPVerificationScreen;
