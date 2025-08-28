import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { useUser } from '../../context/UserContext';

export default function EditDriverProfile() {
  const router = useRouter();
  const { user, setUser } = useUser();

  // Driver-specific fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  const handleSave = () => {
    if (!name || !email || !phone || !carType || !carNumber) {
      Alert.alert('Error', 'Please fill out all fields');
      return;
    }

    setUser({
      ...user,
      name,
      email,
      phone,
      avatar: user?.avatar ?? null,
    });

    Alert.alert('Success', 'Driver profile updated successfully!');
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Driver Profile</Text>

      {/* Avatar */}
      <Image
        source={
          user?.avatar
            ? { uri: user.avatar }
            : require('../../assets/user.jpg')
        }
        style={styles.avatar}
      />

      {/* Inputs */}
      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Phone"
        placeholderTextColor="#aaa"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: 'black',
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#222',
    borderRadius: 25,
    paddingHorizontal: 20,
    color: '#fff',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  saveButton: {
    marginTop: 10,
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  saveText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
