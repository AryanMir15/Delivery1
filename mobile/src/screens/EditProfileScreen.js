import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@apollo/client';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import { UPDATE_USER } from '../api/mutations';
import { updateUser } from '../store/authSlice';
import { useTheme } from '../theme';
import useResponsive from '../hooks/useResponsive';

const EditProfileScreen = ({ navigation }) => {
  const { colors, typography } = useTheme();
  const { scale } = useResponsive();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [errors, setErrors] = useState({});

  const [updateUserMutation, { loading }] = useMutation(UPDATE_USER, {
    onCompleted: (data) => {
      if (data.updateUser) {
        dispatch(updateUser(data.updateUser));
        Alert.alert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/[\s-()]/g, ''))) {
      newErrors.phone = 'Phone number is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      updateUserMutation({
        variables: {
          id: user.id || user._id,
          userInput: {
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            phone: formData.phone.trim(),
          },
        },
      });
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Change Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => {
            // Implement camera functionality
            Alert.alert('Info', 'Camera feature coming soon!');
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: () => {
            // Implement gallery picker
            Alert.alert('Info', 'Gallery picker coming soon!');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const updateFormData = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const renderHeader = () => (
    <View style={s.header}>
      <TouchableOpacity
        style={s.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={s.headerTitle}>Edit Profile</Text>
      <View style={s.placeholder} />
    </View>
  );

  const renderProfileImage = () => (
    <View style={s.imageSection}>
      <View style={s.imageContainer}>
        <Image
          source={{ uri: user?.profileImage || 'https://via.placeholder.com/120' }}
          style={s.profileImage}
        />
        <TouchableOpacity
          style={s.editImageButton}
          onPress={handleImagePicker}
        >
          <Icon name="camera" size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
      <Text style={s.imageHint}>Tap to change profile picture</Text>
    </View>
  );

  const renderForm = () => (
    <View style={s.form}>
      <View style={s.inputGroup}>
        <Text style={s.label}>Full Name</Text>
        <View style={s.inputContainer}>
          <Icon name="account-outline" size={20} color={colors.textSecondary} style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="Enter your full name"
            placeholderTextColor={colors.inputPlaceholder}
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            autoCapitalize="words"
          />
        </View>
        {errors.name && <Text style={s.errorText}>{errors.name}</Text>}
      </View>

      <View style={s.inputGroup}>
        <Text style={s.label}>Email Address</Text>
        <View style={s.inputContainer}>
          <Icon name="email-outline" size={20} color={colors.textSecondary} style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="Enter your email"
            placeholderTextColor={colors.inputPlaceholder}
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {errors.email && <Text style={s.errorText}>{errors.email}</Text>}
      </View>

      <View style={s.inputGroup}>
        <Text style={s.label}>Phone Number</Text>
        <View style={s.inputContainer}>
          <Icon name="phone-outline" size={20} color={colors.textSecondary} style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="Enter your phone number"
            placeholderTextColor={colors.inputPlaceholder}
            value={formData.phone}
            onChangeText={(value) => updateFormData('phone', value)}
            keyboardType="phone-pad"
          />
        </View>
        {errors.phone && <Text style={s.errorText}>{errors.phone}</Text>}
      </View>

      <TouchableOpacity
        style={s.changePasswordButton}
        onPress={() => Alert.alert('Info', 'Change password feature coming soon!')}
      >
        <Icon name="lock-outline" size={20} color={colors.accent} />
        <Text style={s.changePasswordText}>Change Password</Text>
        <Icon name="chevron-right" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  const renderNotificationSettings = () => (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Notification Preferences</Text>
      
      <View style={s.settingItem}>
        <View style={s.settingInfo}>
          <Icon name="bell-outline" size={20} color={colors.accent} />
          <Text style={s.settingLabel}>Order Updates</Text>
        </View>
        <TouchableOpacity style={s.switch}>
          <View style={[s.switchTrack, s.switchTrackActive]}>
            <View style={[s.switchThumb, s.switchThumbActive]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={s.settingItem}>
        <View style={s.settingInfo}>
          <Icon name="tag-outline" size={20} color={colors.accent} />
          <Text style={s.settingLabel}>Promotions & Offers</Text>
        </View>
        <TouchableOpacity style={s.switch}>
          <View style={[s.switchTrack, s.switchTrackActive]}>
            <View style={[s.switchThumb, s.switchThumbActive]} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSaveButton = () => (
    <TouchableOpacity
      style={[s.saveButton, loading && s.saveButtonDisabled]}
      onPress={handleSave}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color={colors.textInverse} />
      ) : (
        <Text style={s.saveButtonText}>Save Changes</Text>
      )}
    </TouchableOpacity>
  );
  const s = styles(colors, typography, scale);


  return (
    <SafeAreaView style={s.container}>
      {renderHeader()}
      
      <ScrollView
        style={s.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {renderProfileImage()}
        {renderForm()}
        {renderNotificationSettings()}
      </ScrollView>

      {renderSaveButton()}
    </SafeAreaView>
  );
};

const styles = (colors, typography, scale = 1) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Math.round(16 * scale),
    paddingVertical: Math.round(12 * scale),
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  placeholder: {
    width: Math.round(40 * scale),
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Math.round(100 * scale),
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: Math.round(32 * scale),
    backgroundColor: colors.surface,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: Math.round(12 * scale),
  },
  profileImage: {
    width: Math.round(120 * scale),
    height: Math.round(120 * scale),
    borderRadius: Math.round(60 * scale),
    borderWidth: 4,
    borderColor: colors.surface,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: Math.round(40 * scale),
    height: Math.round(40 * scale),
    borderRadius: Math.round(20 * scale),
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  imageHint: {
    fontSize: Math.round(14 * scale),
    color: colors.textSecondary,
  },
  form: {
    padding: Math.round(16 * scale),
  },
  inputGroup: {
    marginBottom: Math.round(20 * scale),
  },
  label: {
    fontSize: Math.round(14 * scale),
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Math.round(8 * scale),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: Math.round(12 * scale),
    paddingHorizontal: Math.round(16 * scale),
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputIcon: {
    marginRight: Math.round(12 * scale),
  },
  input: {
    flex: 1,
    height: Math.round(52 * scale),
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
  },
  errorText: {
    color: colors.error,
    fontSize: Math.round(12 * scale),
    marginTop: Math.round(4 * scale),
    marginLeft: Math.round(4 * scale),
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Math.round(16 * scale),
    backgroundColor: colors.accentSurface,
    borderRadius: Math.round(12 * scale),
    marginTop: Math.round(8 * scale),
  },
  changePasswordText: {
    flex: 1,
    fontSize: Math.round(16 * scale),
    fontWeight: '500',
    color: colors.accent,
    marginLeft: Math.round(12 * scale),
  },
  section: {
    padding: Math.round(16 * scale),
    borderTopWidth: 8,
    borderTopColor: colors.surface,
  },
  sectionTitle: {
    fontSize: Math.round(18 * scale),
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: Math.round(16 * scale),
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Math.round(12 * scale),
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: Math.round(16 * scale),
    color: colors.textPrimary,
    marginLeft: Math.round(12 * scale),
  },
  switch: {
    padding: Math.round(4 * scale),
  },
  switchTrack: {
    width: Math.round(50 * scale),
    height: Math.round(28 * scale),
    borderRadius: Math.round(14 * scale),
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: Math.round(2 * scale),
  },
  switchTrackActive: {
    backgroundColor: colors.accent,
  },
  switchThumb: {
    width: Math.round(24 * scale),
    height: Math.round(24 * scale),
    borderRadius: Math.round(12 * scale),
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  saveButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.accent,
    paddingVertical: Math.round(16 * scale),
    alignItems: 'center',
    marginHorizontal: Math.round(16 * scale),
    marginBottom: Math.round(16 * scale),
    borderRadius: Math.round(12 * scale),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.textInverse,
    fontSize: Math.round(16 * scale),
    fontWeight: '600',
  },
});

export default EditProfileScreen;
