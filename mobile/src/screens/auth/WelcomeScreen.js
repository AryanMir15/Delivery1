import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { palette } from '../../theme/colors';
import ShokLogo from '../../components/ShokLogo';
import ShokText from '../../components/ShokText';

const WelcomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const s = styles(colors);

  return (
    <SafeAreaView style={s.container}>
      <LinearGradient
        colors={['#000000', '#000000', '#1c1c1e', '#2c2c2e']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={s.gradient}
      >
        <View style={s.content}>
          <View style={s.logoContainer}>
            <ShokLogo size={120} />
            <View style={{ marginTop: 12, marginBottom: 10 }}>
              <ShokText fontSize={60} />
            </View>
            <Text style={s.tagline}>
              Anything from your city, safely delivered.
            </Text>
          </View>

          <View style={s.buttonContainer}>
            <TouchableOpacity
              style={s.primaryButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[palette.silver, palette.silverLight]}
                style={s.primaryButtonGradient}
              >
                <Text style={s.primaryButtonText}>Get Started</Text>
                <View style={s.arrowCircle}>
                  <Icon name="arrow-right" size={18} color={colors.textInverse} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={s.secondaryButton}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={s.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.termsText}>
            By continuing, you agree to our{' '}
            <Text style={s.termsLink}>Terms</Text> &{' '}
            <Text style={s.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  logoContainer: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 15,
    color: palette.silverLight,
    opacity: 0.95,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    marginTop: 30,
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
    color: colors.textInverse,
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 10,
  },
  arrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(192, 192, 192, 0.5)',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 192, 192, 0.08)',
  },
  secondaryButtonText: {
    color: palette.silver,
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    color: palette.silverDark,
    fontSize: 11,
    textAlign: 'center',
    opacity: 0.85,
    lineHeight: 16,
  },
  termsLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    color: palette.silver,
  },
});

export default WelcomeScreen;
