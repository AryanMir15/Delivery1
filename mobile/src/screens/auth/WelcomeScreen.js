import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#FF6B35', '#F7931E', '#FFB84D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative Circles */}
        <View style={styles.circleTop} />
        <View style={styles.circleBottom} />
        
        <View style={styles.content}>
          {/* Logo Section with Your Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <View style={styles.logoInnerCircle}>
                <Image
                  source={require('../../../assets/logo/logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.appName}>Aksum Delivery</Text>
            <Text style={styles.tagline}>
              Everything you need, delivered to your door
            </Text>
          </View>

          {/* Features Section with Circular Icons */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <View style={styles.featureCircle}>
                <Icon name="lightning-bolt" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.featureText}>Fast{'\n'}Delivery</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureCircle}>
                <Icon name="shield-check" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.featureText}>Secure{'\n'}Payment</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureCircle}>
                <Icon name="star" size={24} color="#FF6B35" />
              </View>
              <Text style={styles.featureText}>Top{'\n'}Rated</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8F8F8']}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <View style={styles.arrowCircle}>
                  <Icon name="arrow-right" size={18} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms</Text> &{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  // Decorative circles
  circleTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circleBottom: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  // Logo section
  logoContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  logoCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoInnerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.95,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Features section
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },
  // Buttons
  buttonContainer: {
    marginBottom: 10,
  },
  primaryButton: {
    marginBottom: 12,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FF6B35',
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 10,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Terms
  termsText: {
    color: '#FFFFFF',
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 16,
  },
  termsLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;
