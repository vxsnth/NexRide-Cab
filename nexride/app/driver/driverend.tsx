import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { socket } from '../../sockets/socket';

interface DriverEndProps {
  rideId: string;
}

const DriverEnd = ({ rideId }: DriverEndProps) => {
  const router = useRouter();
  const [riderName, setRiderName] = useState('');
  const [fare, setFare] = useState('');
  const [rating, setRating] = useState(0);
  const [rideEnded, setRideEnded] = useState(false);

  useEffect(() => {
    socket.emit('joinRide', { rideId });

    socket.on('rideAccepted', (data) => {
      if (data.rideId === rideId) {
        setRiderName(data.riderName);
        setFare(data.price || '0');
      }
    });

    socket.on('rideEnded', (data) => {
      if (data.rideId === rideId) setRideEnded(true);
    });

    return () => {
      socket.off('rideAccepted');
      socket.off('rideEnded');
    };
  }, [rideId]);

  const handleRating = (value: number) => {
    setRating(value);
    socket.emit('submitRating', { rideId, role: 'driver', rating: value });
    console.log(`Rated ${value} stars for rider ${riderName}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Ride Completed!</Text>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>Rider:</Text>
        <Text style={styles.infoValue}>{riderName}</Text>
        <Text style={styles.infoLabel}>Earnings:</Text>
        <Text style={styles.infoValue}>₹{fare}</Text>
      </View>

      <Text style={styles.ratingTitle}>Rate your rider:</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((i) => (
          <TouchableOpacity key={i} onPress={() => handleRating(i)}>
            <Text style={i <= rating ? styles.starSelected : styles.star}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      {rideEnded && (
        <TouchableOpacity style={styles.doneButton} onPress={() => router.push('/')}>
          <Text style={styles.doneText}>Back to Home</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default DriverEnd;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F5F5F5' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, color: '#333' },
  card: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5, marginBottom: 30 },
  infoLabel: { fontSize: 16, color: '#666', marginTop: 10 },
  infoValue: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  ratingTitle: { fontSize: 18, marginBottom: 10, color: '#333' },
  stars: { flexDirection: 'row', marginBottom: 30 },
  star: { fontSize: 35, color: '#ccc', marginHorizontal: 5 },
  starSelected: { fontSize: 35, color: '#FFD700', marginHorizontal: 5 },
  doneButton: { backgroundColor: '#2196F3', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10 },
  doneText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
