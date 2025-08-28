const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const rides = [];

io.on('connection', (socket) => {
  console.log('✅ New user connected:', socket.id);

  // Rider requests ride
  socket.on('rideRequest', (data) => {
    const rideId = `${socket.id}-${Date.now()}`;
    const ride = {
      rideId,
      pickup: data.pickup,
      drop: data.drop,
      price: data.price,
      pickupCoords: data.pickupCoords,
      dropCoords: data.dropCoords,
      riderSocketId: socket.id,
      name: data.name || 'Rider',
      rideType: data.rideType || 'Standard',
    };

    rides.push(ride);
    io.emit('newRide', ride);
    console.log('📡 New ride emitted:', ride);
  });

  // Driver accepts ride
  socket.on('acceptRide', ({ rideId, driverName, driverPhone, rideType }) => {
    const ride = rides.find(r => r.rideId === rideId);
    if (ride) {
      io.to(ride.riderSocketId).emit('rideAccepted', {
        driverSocketId: socket.id,
        rideId,
        driverName,
        driverPhone,
        rideType,
        carNumber: 'PB10XX1234',
        pickup: ride.pickup,
        drop: ride.drop,
        pickupTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        pickupCoords: ride.pickupCoords,
        dropCoords: ride.dropCoords,
        riderName: ride.name,
      });
    }
  });

  // Driver location update
  socket.on('driverLocation', ({ rideId, coords }) => {
    const ride = rides.find((r) => r.rideId === rideId);
    if (ride && coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number') {
      io.to(ride.riderSocketId).emit('driverLocation', { rideId, coords });
      console.log('📡 Driver location forwarded:', coords);
    } else {
      console.log('⚠️ Invalid driverLocation ignored:', coords);
    }
  });

  socket.on('riderPresent', ({ rideId }) => {
    io.emit('riderPresent', { rideId });
    console.log('✅ Rider Present confirmed for ride:', rideId);
  });

  socket.on('riderConfirmed', ({ rideId }) => {
    io.emit('riderConfirmed', { rideId });
    console.log('✅ Rider confirmed, drop route will start for ride:', rideId);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
