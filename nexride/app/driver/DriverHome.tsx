import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUser } from '../../context/UserContext';
import { socket } from '../../sockets/socket';

export default function DriverHome() {
  const [rideRequests, setRideRequests] = useState([]);
  const { user } = useUser();
  const router = useRouter();

  const playSound = async (type) => {
    const soundMap = {
      notification: require('../../assets/notification.mp3'),
      accept: require('../../assets/accept.mp3'),
      reject: require('../../assets/reject.mp3'),
    };
    try {
      const { sound } = await Audio.Sound.createAsync(soundMap[type]);
      await sound.playAsync();
    } catch (e) {
      console.log('🔇 Sound play error:', e);
    }
  };

  useEffect(() => {
    if (!socket.connected) {
      console.log('🔌 Connecting socket...');
      socket.connect();
    }

    const onNewRide = (ride) => {
      console.log('📥 New ride:', ride);
      setRideRequests((prev) => [...prev, ride]);
      playSound('notification');
    };

    socket.on('newRide', onNewRide);

    return () => {
      socket.off('newRide', onNewRide);
    };
  }, []);

  const handleAccept = async (ride) => {
  await playSound('accept');

  socket.emit('acceptRide', {
    status: 'accepted',
    rideId: ride.rideId,
    riderSocketId: ride.riderSocketId, // required if you're targeting specific rider
    driverName: user.name,
    driverPhone: user.phone || '9876543210',
    rideType: ride.rideType,
  });

  router.push({
    pathname: '/driver/DriverTracking',
    params: {
      rideId: ride.rideId,
      pickupLat: ride.pickupCoords.latitude,
      pickupLng: ride.pickupCoords.longitude,
      dropLat: ride.dropCoords.latitude,
      dropLng: ride.dropCoords.longitude,
    },
  });

  setRideRequests((prev) => prev.filter((r) => r.rideId !== ride.rideId));
};


  const handleReject = async (ride) => {
    await playSound('reject');
    socket.emit('rejectRide', {
      rideId: ride.rideId,
      driverName: user.name,
    });

    setRideRequests((prev) => prev.filter((r) => r.rideId !== ride.rideId));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('../driver/DriverProfile')}>
          <Image
            source={user?.avatar || require('../../assets/user.jpg')}
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={styles.header}>Welcome, {user?.name || 'Driver'}</Text>
      </View>

      {/* Ride Cards */}
      <Text style={styles.title}>Available Rides</Text>
      {rideRequests.length === 0 && (
        <Text style={styles.waitText}>⏳ Waiting for ride requests...</Text>
      )}

      {rideRequests.map((ride) => (
        <View key={ride.rideId} style={styles.card}>
          <Text style={styles.text}>Pickup: {ride.pickup}</Text>
          <Text style={styles.text}>Drop: {ride.drop}</Text>
          <Text style={styles.text}>Price: ₹{ride.price}</Text>
          <Text style={styles.text}>Rider: {ride.name}</Text>
          <Text style={styles.text}>Car Type: {ride.rideType}</Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(ride)}>
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(ride)}>
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', padding: 20 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  header: {
    fontSize: 20,
    color: '#FFD700',
    marginLeft: 10,
    fontWeight: 'bold',
  },
  title: { color: '#FFD700', fontSize: 22, textAlign: 'center', marginBottom: 20 },
  waitText: { color: 'gray', fontSize: 16, textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#1c1c1e',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  text: { color: 'white', fontSize: 16, marginBottom: 6 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  acceptBtn: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  rejectBtn: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  acceptText: { color: 'black', fontWeight: 'bold' },
  rejectText: { color: 'white', fontWeight: 'bold' },
});
