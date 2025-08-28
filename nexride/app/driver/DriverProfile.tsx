import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useUser } from '../../context/UserContext';

export default function DriverProfile() {
  const { user, setUser } = useUser();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          setUser(null);
          router.replace('../signup'); // ✅ go back to signup
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    router.push("/driver/EditDriverProfile"); // ✅ navigate to edit screen
  };

  // ✅ If user is null, show a fallback instead of crashing
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white', fontSize: 18 }}>Logging out...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={user.avatar || require('../../assets/user.jpg')}
        style={styles.avatar}
      />
      <Text style={styles.name}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>

      <View style={styles.infoContainer}>
        <Info label="Gender" value={user.gender} />

        {user.phone ? <Info label="Phone Number" value={user.phone} /> : null}

        {user.experience ? (
          <Info label="Experience" value={`${user.experience} years`} />
        ) : null}

        {user.rating ? (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Rating:</Text>
            <View style={styles.ratingBox}>
              <Text style={styles.value}>{user.rating} / 5</Text>
              <Ionicons name="star" size={20} color="#FFD700" />
            </View>
          </View>
        ) : null}
      </View>

      <TouchableOpacity onPress={handleEditProfile} style={styles.editBtn}>
        <Text style={styles.editText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.label}>{label}:</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 32,
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 24,
  },
  infoContainer: {
    width: '100%',
    marginTop: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  label: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
  value: {
    color: 'white',
    fontSize: 16,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtn: {
    marginTop: 30,
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  editText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutBtn: {
    marginTop: 16,
    borderColor: '#FFD700',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  logoutText: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
