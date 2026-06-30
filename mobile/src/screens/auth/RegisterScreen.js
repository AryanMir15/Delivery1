import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useMutation } from '@apollo/client';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { REGISTER_USER, SEND_OTP_EMAIL } from '../../api/mutations';
import { loginStart, loginSuccess, loginFailure, setAuthToken } from '../../store/authSlice';
import { useTheme } from '../../theme';
import { palette } from '../../theme/colors';
import ShokLogo from '../../components/ShokLogo';
import UserIcon from '../../components/UserIcon';

const PLACEHOLDER_COLOR = '#a1a1a6';

const RegisterScreen = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const [sendOtpEmail] = useMutation(SEND_OTP_EMAIL, {
    onCompleted: (data) => {
      if (data.sendOtpToEmail.result) {
        navigation.navigate('OTPVerification', {
          email: formData.email.trim().toLowerCase(),
          userData: formData,
          fromRegistration: true,
        });
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const [registerMutation, { loading }] = useMutation(REGISTER_USER, {
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
      }
    },
    onError: (error) => {
      dispatch(loginFailure(error.message));
      Alert.alert('Registration Failed', error.message);
    },
  });

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/[\s-()]/g, ''))) {
      newErrors.phone = 'Phone number is invalid';
    }

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (validateForm()) {
      if (formData.email.trim()) {
        Alert.alert(
          'Email Verification',
          'We will send a verification code to your email. Continue?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Send Code',
              onPress: () => {
                sendOtpEmail({
                  variables: {
                    email: formData.email.trim().toLowerCase(),
                  },
                });
              },
            },
          ]
        );
      } else {
        registerMutation({
          variables: {
            input: {
              name: formData.name.trim(),
              email: formData.email.trim().toLowerCase() || '',
              phone: formData.phone.trim(),
              password: formData.password,
            },
          },
        });
      }
    }
  };

  const updateFormData = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const s = styles(colors, typography);

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.keyboardView}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={s.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={s.header}>
            <ShokLogo size={112} />
            <Text style={s.title}>Create Account</Text>
            <Text style={s.subtitle}>Join us and unlock your city.</Text>
          </View>

          <View style={s.form}>
            <View style={s.inputContainer}>
              <UserIcon size={22} color={colors.textSecondary} />
              <View style={{ marginRight: 12 }} />
              <TextInput
                style={s.input}
                placeholder="Full Name"
                placeholderTextColor={PLACEHOLDER_COLOR}
                color={colors.inputText}
                value={formData.name}
                onChangeText={(value) => updateFormData('name', value)}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            {errors.name && <Text style={s.errorText}>{errors.name}</Text>}

            <View style={s.inputContainer}>
              <Icon name="phone-outline" size={22} color={colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Phone Number"
                placeholderTextColor={PLACEHOLDER_COLOR}
                color={colors.inputText}
                value={formData.phone}
                onChangeText={(value) => updateFormData('phone', value)}
                keyboardType="phone-pad"
              />
            </View>
            {errors.phone && <Text style={s.errorText}>{errors.phone}</Text>}

            <View style={s.inputContainer}>
              <Icon name="email-outline" size={22} color={colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Email Address (Optional)"
                placeholderTextColor={PLACEHOLDER_COLOR}
                color={colors.inputText}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={s.errorText}>{errors.email}</Text>}

            <View style={s.inputContainer}>
              <Icon name="lock-outline" size={22} color={colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Password"
                placeholderTextColor={PLACEHOLDER_COLOR}
                color={colors.inputText}
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={s.eyeIcon}
              >
                <Icon
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={s.errorText}>{errors.password}</Text>}

            <View style={s.inputContainer}>
              <Icon name="lock-outline" size={22} color={colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Confirm Password"
                placeholderTextColor={PLACEHOLDER_COLOR}
                color={colors.inputText}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={s.eyeIcon}
              >
                <Icon
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text style={s.errorText}>{errors.confirmPassword}</Text>}

            <TouchableOpacity
              style={[s.registerButton, loading && s.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.buttonPrimaryText} />
              ) : (
                <Text style={s.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={s.termsContainer}>
            <Text style={s.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={s.termsLink}>Terms of Service</Text> and{' '}
              <Text style={s.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    fontSize: 32,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: colors.inputText,
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  registerButton: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  termsContainer: {
    marginBottom: 24,
  },
  termsText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: colors.accent,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  footerLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
