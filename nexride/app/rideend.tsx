import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { socket } from '.././sockets/socket';

interface RiderEndProps {
  rideId: string;
}

const RiderEnd = ({ rideId }: RiderEndProps) => {
  const router = useRouter();
  const [driverName, setDriverName] = useState('');
  const [fare, setFare] = useState('');
  const [rating, setRating] = useState(0);
  const [rideEnded, setRideEnded] = useState(false);

  useEffect(() => {
    socket.emit('joinRide', { rideId });

    socket.on('rideAccepted', (data) => {
      if (data.rideId === rideId) {
        setDriverName(data.driverName);
        setFare(data.price || '0');
      }
    });

    socket.on('rideEnded', (data) => {
      if (data.rideId === rideId) {
        console.log('Ride ended!', data);
        setRideEnded(true);
      }
    });

    return () => {
      socket.off('rideAccepted');
      socket.off('rideEnded');
    };
  }, [rideId]);

  const handlePayNow = () => {
    console.log('Paying fare:', fare);
    // integrate payment here
  };

  const handleRating = (value: number) => {
    setRating(value);
    socket.emit('submitRating', { rideId, role: 'rider', rating: value });
    console.log(`Rated ${value} stars for driver ${driverName}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 Ride Completed!</Text>

      <View style={styles.card}>
        <Text style={styles.infoLabel}>Driver:</Text>
        <Text style={styles.infoValue}>{driverName}</Text>
        <Text style={styles.infoLabel}>Fare:</Text>
        <Text style={styles.infoValue}>₹{fare}</Text>
      </View>

      <TouchableOpacity
        style={[styles.payButton, !rideEnded && { opacity: 0.6 }]}
        onPress={handlePayNow}
        disabled={!rideEnded}
      >
        <Text style={styles.payText}>Pay Now</Text>
      </TouchableOpacity>

      <Text style={styles.ratingTitle}>Rate your ride:</Text>
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

export default RiderEnd;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F5F5F5' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 30, color: '#333' },
  card: { width: '90%', backgroundColor: '#fff', padding: 20, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5, marginBottom: 20 },
  infoLabel: { fontSize: 16, color: '#666', marginTop: 10 },
  infoValue: { fontSize: 20, fontWeight: 'bold', color: '#222' },
  payButton: { backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, marginBottom: 30 },
  payText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  ratingTitle: { fontSize: 18, marginBottom: 10, color: '#333' },
  stars: { flexDirection: 'row', marginBottom: 30 },
  star: { fontSize: 35, color: '#ccc', marginHorizontal: 5 },
  starSelected: { fontSize: 35, color: '#FFD700', marginHorizontal: 5 },
  doneButton: { backgroundColor: '#2196F3', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10 },
  doneText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
