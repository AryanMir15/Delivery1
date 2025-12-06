import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useMutation } from '@apollo/client';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { LOGIN_RIDER } from '../api/mutations';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import socketService from '../services/socketService';

const LoginScreen = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loginMutation, { loading }] = useMutation(LOGIN_RIDER, {
    onCompleted: async (data) => {
      if (data.login) {
        const { token, userId, name, email, phone, userTypeId } = data.login;
        
        // Validate that user is a rider
        if (userTypeId !== 'rider') {
          dispatch(loginFailure('Access denied. This app is only for riders.'));
          Alert.alert(
            'Access Denied',
            'This app is only for delivery riders. Please use the customer app instead.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        console.log('🔑 Rider login successful!');
        console.log('   User ID:', userId);
        console.log('   Name:', name);
        
        await AsyncStorage.setItem('riderToken', token);
        
        // Connect to Socket.io for real-time tracking
        try {
          await socketService.connect();
          console.log('✅ Socket.io connected');
        } catch (error) {
          console.warn('⚠️ Socket connection failed:', error.message);
        }
        
        dispatch(
          loginSuccess({
            rider: {
              id: userId,
              name,
              email,
              phone,
              role: userTypeId,
            },
            token,
          })
        );
      }
    },
    onError: (error) => {
      dispatch(loginFailure(error.message));
      const errorMessage = error.message.includes('User not found')
        ? 'Invalid email or password'
        : error.message.includes('network')
        ? 'Network error. Please check your connection.'
        : error.message;
      
      Alert.alert('Login Failed', errorMessage);
    },
  });

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    dispatch(loginStart());
    loginMutation({
      variables: {
        email: email.trim().toLowerCase(),
        password,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Icon name="bike-fast" size={80} color="#2EC4B6" />
          </View>
          <Text style={styles.title}>Rider App</Text>
          <Text style={styles.subtitle}>Sign in to start delivering</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Icon name="email-outline" size={20} color="#6C757D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#A8DADC"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock-outline" size={20} color="#6C757D" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#A8DADC"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#6C757D"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms & Conditions
          </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0F7F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
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
    height: 52,
    fontSize: 16,
    color: '#1D3557',
  },
  loginButton: {
    backgroundColor: '#2EC4B6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6C757D',
    textAlign: 'center',
  },
});

export default LoginScreen;
