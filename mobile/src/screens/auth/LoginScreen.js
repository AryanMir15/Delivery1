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

import { LOGIN_USER } from '../../api/mutations';
import { loginStart, loginSuccess, loginFailure, setAuthToken } from '../../store/authSlice';
import SessionService from '../../services/SessionService';
import { useTheme } from '../../theme';
import ShokLogo from '../../components/ShokLogo';

const LoginScreen = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [loginMutation] = useMutation(LOGIN_USER, {
    onCompleted: async (data) => {
      setIsLoggingIn(false);

      if (data.login) {
        const { token, userId, name, email, phone, picture, isActive, userTypeId, roles } = data.login;

        try {
          await AsyncStorage.setItem('authToken', token);
          dispatch(setAuthToken(token));
          dispatch(
            loginSuccess({
              user: {
                id: userId,
                _id: userId,
                name,
                email,
                phone,
                profileImage: picture,
                isActive,
                role: userTypeId,
                roles: roles || [userTypeId],
              },
              token,
            })
          );

          SessionService.mergeGuestToUserSession(userId)
            .then(() => {})
            .catch(err => console.error('Session merge error:', err));

        } catch (error) {
          setIsLoggingIn(false);
          dispatch(loginFailure('Failed to save login data'));
          Alert.alert('Login Error', 'Failed to save login data. Please try again.');
        }
      } else {
        setIsLoggingIn(false);
        dispatch(loginFailure('Login failed - no data returned'));
        Alert.alert('Login Failed', 'No data returned from server');
      }
    },
    onError: (error) => {
      setIsLoggingIn(false);
      dispatch(loginFailure(error.message));
      Alert.alert('Login Failed', error.message || 'Network error. Please check your connection.');
    },
  });

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoggingIn(true);
    dispatch(loginStart());

    const timeoutId = setTimeout(() => {
      setIsLoggingIn(false);
      dispatch(loginFailure('Login timeout - please check your connection'));
      Alert.alert('Login Timeout', 'Request took too long. Please check your internet connection and try again.');
    }, 15000);

    try {
      await loginMutation({
        variables: {
          email: email.trim().toLowerCase(),
          password,
          type: 'default',
        },
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      setIsLoggingIn(false);
      dispatch(loginFailure(error.message || 'Login failed'));
      Alert.alert('Login Error', error.message || 'An error occurred during login');
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
            <Text style={s.title}>Welcome Back</Text>
            <Text style={s.subtitle}>Sign in to continue ordering</Text>
          </View>

          <View style={s.form}>
            <View style={s.inputContainer}>
              <Icon name="email-outline" size={22} color={colors.textSecondary} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="Email Address"
                placeholderTextColor="#a1a1a6"
                color={colors.inputText}
                value={email}
                onChangeText={setEmail}
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
                placeholderTextColor="#a1a1a6"
                color={colors.inputText}
                value={password}
                onChangeText={setPassword}
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

            <TouchableOpacity
              style={s.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={s.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.loginButton, isLoggingIn && s.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator color={colors.buttonPrimaryText} />
              ) : (
                <Text style={s.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>OR</Text>
            <View style={s.dividerLine} />
          </View>

          <View style={s.socialButtons}>
            <TouchableOpacity style={s.socialButton}>
              <Icon name="google" size={24} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={s.socialButton}>
              <Icon name="facebook" size={24} color="#4267B2" />
            </TouchableOpacity>
            <TouchableOpacity style={s.socialButton}>
              <Icon name="apple" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.footerLink}>Sign Up</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    marginHorizontal: 16,
    color: colors.textSecondary,
    fontSize: 14,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
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

export default LoginScreen;
