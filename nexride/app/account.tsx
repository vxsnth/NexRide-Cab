import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../context/UserContext'; // 👈 import your user context

export default function AccountPage() {
  const router = useRouter();
  const { user } = useUser(); // 👈 get user from context

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.name}>No user data found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile Image */}
      {typeof user.avatar === 'string' && user.avatar.trim() !== '' ? (
  <Image source={{ uri: user.avatar }} style={styles.avatar} />
) : (
  <Image source={require('../assets/user.jpg')} style={styles.avatar} />
)}


      {/* User Info */}
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <Text style={styles.gender}>Gender: {user.gender}</Text>

      {/* Buttons */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('../editprofile')}
      >
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/ridehistory')}
      >
        <Text style={styles.buttonText}>My Rides</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={() => {
          // Optionally clear user from context here
          router.replace('/');
        }}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    alignItems: 'center',
    paddingTop: 60,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  email: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
  },
  gender: {
    fontSize: 16,
    color: '#fff',
    marginTop: 4,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 15,
    width: '70%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  logoutText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
