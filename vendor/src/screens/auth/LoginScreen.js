import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useMutation } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { OWNER_LOGIN } from '../../api/queries';
import { loginStart, loginSuccess, loginFailure, clearError } from '../../store/authSlice';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Local loading state
  
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.auth);

  const [ownerLogin] = useMutation(OWNER_LOGIN);

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, []);

  // Clear error when user types
  const handleEmailChange = (text) => {
    setEmail(text);
    if (error) dispatch(clearError());
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (error) dispatch(clearError());
  };

  const handleLogin = async () => {
    // Validate inputs
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    console.log('🔵 Login started:', email);
    setIsLoading(true); // Set local loading state
    dispatch(loginStart());

    try {
      const { data } = await ownerLogin({
        variables: { 
          email: email.trim().toLowerCase(), 
          password 
        },
      });

      console.log('✅ Login response received');

      if (data?.ownerLogin) {
        const { token, userId, name, email: userEmail, restaurants, image } = data.ownerLogin;

        if (!token || !userId) {
          throw new Error('Invalid response from server');
        }

        // Save token
        await AsyncStorage.setItem('vendorToken', token);

        // Update Redux state
        dispatch(loginSuccess({
          user: {
            id: userId,
            name: name || 'Vendor',
            email: userEmail || email,
            image: image || null,
          },
          token,
          restaurants: restaurants || [],
        }));

        console.log('✅ Login successful!');
      } else {
        throw new Error('No data returned from server');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      
      let errorMessage = 'Login failed';
      
      if (err.networkError) {
        errorMessage = 'Cannot connect to server. Check if backend is running.';
      } else if (err.graphQLErrors && err.graphQLErrors.length > 0) {
        errorMessage = err.graphQLErrors[0].message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      dispatch(loginFailure(errorMessage));
      Alert.alert('Login Failed', errorMessage);
    } finally {
      // Always reset loading state
      setIsLoading(false);
      console.log('🔵 Login process completed');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Ionicons name="storefront" size={80} color="#4CAF50" />
          <Text style={styles.title}>Vendor App</Text>
          <Text style={styles.subtitle}>Manage your shop</Text>
        </View>

        {/* Login Form */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#c62828" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.loginButtonText}>Logging in...</Text>
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Test Credentials */}
        <View style={styles.testCredentials}>
          <Text style={styles.testTitle}>Test Credentials:</Text>
          <Text style={styles.testText}>Email: vendor@test.com</Text>
          <Text style={styles.testText}>Password: vendor123</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#c62828',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    backgroundColor: '#a5d6a7',
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  testCredentials: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  testTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  testText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
