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

const EditProfileScreen = ({ navigation }) => {
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
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color="#1D3557" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Profile</Text>
      <View style={styles.placeholder} />
    </View>
  );

  const renderProfileImage = () => (
    <View style={styles.imageSection}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: user?.profileImage || 'https://via.placeholder.com/120' }}
          style={styles.profileImage}
        />
        <TouchableOpacity
          style={styles.editImageButton}
          onPress={handleImagePicker}
        >
          <Icon name="camera" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      <Text style={styles.imageHint}>Tap to change profile picture</Text>
    </View>
  );

  const renderForm = () => (
    <View style={styles.form}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.inputContainer}>
          <Icon name="account-outline" size={20} color="#6C757D" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#A8DADC"
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            autoCapitalize="words"
          />
        </View>
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputContainer}>
          <Icon name="email-outline" size={20} color="#6C757D" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#A8DADC"
            value={formData.email}
            onChangeText={(value) => updateFormData('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <View style={styles.inputContainer}>
          <Icon name="phone-outline" size={20} color="#6C757D" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            placeholderTextColor="#A8DADC"
            value={formData.phone}
            onChangeText={(value) => updateFormData('phone', value)}
            keyboardType="phone-pad"
          />
        </View>
        {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      <TouchableOpacity
        style={styles.changePasswordButton}
        onPress={() => Alert.alert('Info', 'Change password feature coming soon!')}
      >
        <Icon name="lock-outline" size={20} color="#FF6B35" />
        <Text style={styles.changePasswordText}>Change Password</Text>
        <Icon name="chevron-right" size={20} color="#6C757D" />
      </TouchableOpacity>
    </View>
  );

  const renderNotificationSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notification Preferences</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Icon name="bell-outline" size={20} color="#FF6B35" />
          <Text style={styles.settingLabel}>Order Updates</Text>
        </View>
        <TouchableOpacity style={styles.switch}>
          <View style={[styles.switchTrack, styles.switchTrackActive]}>
            <View style={[styles.switchThumb, styles.switchThumbActive]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Icon name="tag-outline" size={20} color="#FF6B35" />
          <Text style={styles.settingLabel}>Promotions & Offers</Text>
        </View>
        <TouchableOpacity style={styles.switch}>
          <View style={[styles.switchTrack, styles.switchTrackActive]}>
            <View style={[styles.switchThumb, styles.switchThumbActive]} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSaveButton = () => (
    <TouchableOpacity
      style={[styles.saveButton, loading && styles.saveButtonDisabled]}
      onPress={handleSave}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={styles.saveButtonText}>Save Changes</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderProfileImage()}
        {renderForm()}
        {renderNotificationSettings()}
      </ScrollView>

      {renderSaveButton()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F8F9FA',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  imageHint: {
    fontSize: 14,
    color: '#6C757D',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D3557',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
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
  errorText: {
    color: '#E63946',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    marginTop: 8,
  },
  changePasswordText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#FF6B35',
    marginLeft: 12,
  },
  section: {
    padding: 16,
    borderTopWidth: 8,
    borderTopColor: '#F8F9FA',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D3557',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1D3557',
    marginLeft: 12,
  },
  switch: {
    padding: 4,
  },
  switchTrack: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E9ECEF',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchTrackActive: {
    backgroundColor: '#FF6B35',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
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
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
