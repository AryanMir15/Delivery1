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

const LoginScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [loginMutation] = useMutation(LOGIN_USER, {
    onCompleted: async (data) => {
      console.log('✅ Login completed:', data);
      setIsLoggingIn(false);
      
      if (data.login) {
        const { token, userId, name, email, phone, picture, isActive, userTypeId } = data.login;
        
        try {
          // Save token first
          await AsyncStorage.setItem('authToken', token);
          console.log('✅ Token saved');
          
          // Update Redux state
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
              },
              token,
            })
          );
          console.log('✅ Redux state updated');
          
          // Merge guest session in background (non-blocking)
          SessionService.mergeGuestToUserSession(userId)
            .then(() => console.log('✅ Guest session merged'))
            .catch(err => console.error('⚠️  Session merge error:', err));
            
        } catch (error) {
          console.error('❌ Error saving login data:', error);
          setIsLoggingIn(false);
          dispatch(loginFailure('Failed to save login data'));
          Alert.alert('Login Error', 'Failed to save login data. Please try again.');
        }
      } else {
        console.error('❌ No login data returned');
        setIsLoggingIn(false);
        dispatch(loginFailure('Login failed - no data returned'));
        Alert.alert('Login Failed', 'No data returned from server');
      }
    },
    onError: (error) => {
      console.error('❌ Login error:', error);
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
    console.log('🔵 Login button clicked');
    
    // Clear previous errors
    setErrors({});
    
    if (!validateForm()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('🔵 Starting login process...');
    console.log('   Email:', email.trim().toLowerCase());
    console.log('   API URL:', 'http://10.0.26.24:4000/graphql');
    
    setIsLoggingIn(true);
    dispatch(loginStart());
    
    // Set timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('⏰ Login timeout reached');
      setIsLoggingIn(false);
      dispatch(loginFailure('Login timeout - please check your connection'));
      Alert.alert('Login Timeout', 'Request took too long. Please check your internet connection and try again.');
    }, 15000); // 15 second timeout

    try {
      console.log('🔵 Sending login mutation...');
      const result = await loginMutation({
        variables: {
          email: email.trim().toLowerCase(),
          password,
          type: 'default',
        },
      });
      console.log('✅ Mutation completed:', result);
      clearTimeout(timeoutId);
    } catch (error) {
      console.log('❌ Mutation error:', error);
      clearTimeout(timeoutId);
      setIsLoggingIn(false);
      console.error('Login mutation error:', error);
      dispatch(loginFailure(error.message || 'Login failed'));
      Alert.alert('Login Error', error.message || 'An error occurred during login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#1D3557" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue ordering</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Icon name="email-outline" size={22} color="#6C757D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#A8DADC"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

            <View style={styles.inputContainer}>
              <Icon name="lock-outline" size={22} color="#6C757D" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#A8DADC"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Icon
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#6C757D"
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Icon name="google" size={24} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Icon name="facebook" size={24} color="#4267B2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Icon name="apple" size={24} color="#000000" />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  header: {
    marginTop: 32,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6C757D',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1D3557',
  },
  eyeIcon: {
    padding: 8,
  },
  errorText: {
    color: '#E63946',
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
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#E9ECEF',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6C757D',
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
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#6C757D',
    fontSize: 14,
  },
  footerLink: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;