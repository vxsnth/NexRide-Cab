import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { socket } from '../sockets/socket';

export default function RiderWaiting() {
  const [status, setStatus] = useState('Looking for drivers...');
  const [rideDetails, setRideDetails] = useState(null);
  const router = useRouter();

  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/accept.mp3')
      );
      await sound.playAsync();
    } catch (error) {
      console.log('🔇 Failed to play notification sound:', error);
    }
  };

  useEffect(() => {
    const onRideAccepted = (data) => {
      playNotificationSound();
      setStatus(`✅ Driver ${data.driverName} accepted. Preparing ride...`);

      const pickupTime = data.pickupTime || new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dropTime = new Date(Date.now() + 25 * 60000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      setRideDetails({
        driverName: data.driverName,
        driverPhone: data.driverPhone || '9876543210',
        rideType: data.rideType || 'Standard',
        carNumber: data.carNumber || 'DL3CAF1234',
        pickupTime,
        dropTime,
        pickup: data.pickup,
        drop: data.drop,
      });

      setTimeout(() => {
        router.replace({
          pathname: '/riderscreen',
          params: {
            pickupLat: data.pickupCoords.latitude,
            pickupLng: data.pickupCoords.longitude,
            dropLat: data.dropCoords.latitude,
            dropLng: data.dropCoords.longitude,
            rideId: data.rideId,
          },
        });
      }, 120000); 
    };

    socket.on('rideAccepted', onRideAccepted);
    return () => {
      socket.off('rideAccepted', onRideAccepted);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {rideDetails ? '✅ Ride Confirmed!' : 'Finding your ride...'}
      </Text>
      {!rideDetails ? (
        <>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.status}>{status}</Text>
        </>
      ) : (
        <View style={styles.flashcard}>
          <Text style={styles.flashTitle}>🚘 Ride Details</Text>
          <Text style={styles.detail}>Pickup: {rideDetails.pickup}</Text>
          <Text style={styles.detail}>Drop: {rideDetails.drop}</Text>
          <Text style={styles.detail}>Pickup ETA: {rideDetails.pickupTime}</Text>
          <Text style={styles.detail}>Drop ETA: {rideDetails.dropTime}</Text>
          <Text style={styles.detail}>Car Type: {rideDetails.rideType}</Text>
          <Text style={styles.detail}>Car Number: {rideDetails.carNumber}</Text>
          <Text style={styles.detail}>Driver: {rideDetails.driverName}</Text>
          <Text style={styles.detail}>Phone Number: {rideDetails.driverPhone}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  status: {
    marginTop: 20,
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  flashcard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 20,
    marginTop: 30,
    width: '100%',
  },
  flashTitle: {
    fontSize: 20,
    color: '#FFD700',
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detail: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },
});
