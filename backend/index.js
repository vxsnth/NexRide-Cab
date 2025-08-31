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

const rides = []; // store ride info including driver & rider

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
      driverSocketId: null,
      status: 'ongoing',
      name: data.name || 'Rider',
      rideType: data.rideType || 'Standard',
      otp: Math.floor(1000 + Math.random() * 9000).toString().padStart(4, '0'),
    };

    rides.push(ride);
    io.emit('newRide', ride);
    console.log('📡 New ride emitted:', ride);
  });

  // Driver accepts ride
  socket.on('acceptRide', ({ rideId, driverName, driverPhone, rideType }) => {
    const ride = rides.find(r => r.rideId === rideId);
    if (ride) {
      ride.driverSocketId = socket.id; // track driver socket
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
        otp: ride.otp,
      });
      console.log(`✅ Ride ${rideId} accepted by driver ${driverName}`);
    }
  });
  socket.on('verifyOtp', ({ rideId, otp }, ack) => {
    const ride = rides.find(r => r.rideId === rideId);
    if (!ride) return ack?.({ ok: false, error: "Ride not found" });
  
    if (ride.otp === String(otp).trim()) {
      ride.status = 'ongoing';
      io.to(ride.riderSocketId).emit('rideStarted', { rideId });
      io.to(ride.driverSocketId).emit('rideStarted', { rideId });
      return ack?.({ ok: true });
    } else {
      return ack?.({ ok: false, error: "Invalid OTP" });
    }
  });

  // Driver location updates
  socket.on('driverLocation', ({ rideId, coords }) => {
    const ride = rides.find((r) => r.rideId === rideId);
    if (ride && coords?.latitude && coords?.longitude) {
      io.to(ride.riderSocketId).emit('driverLocation', { rideId, coords });
      console.log('📡 Driver location forwarded:', coords);
    }
  });

  // Rider confirms presence
  socket.on('riderPresent', ({ rideId }) => {
    io.emit('riderPresent', { rideId });
    console.log('✅ Rider Present confirmed for ride:', rideId);
  });

  socket.on('riderConfirmed', ({ rideId }) => {
    io.emit('riderConfirmed', { rideId });
    console.log('✅ Rider confirmed, drop route will start for ride:', rideId);
  });

  // --------- Cleaned up ride end logic ---------
  socket.on('endRide', ({ rideId }) => {
    console.log("📩 Ride ended event received:", rideId);
    const ride = rides.find(r => r.rideId === rideId);
    if (ride) {
      ride.status = 'ended';
      // Notify both rider and driver
      if (ride.riderSocketId) io.to(ride.riderSocketId).emit('rideEnded', { rideId });
      if (ride.driverSocketId) io.to(ride.driverSocketId).emit('rideEnded', { rideId });
      console.log("📡 rideEnded emitted to rider & driver:", ride.riderSocketId, ride.driverSocketId);
    }
  });

  // Optional: join room for future use
  socket.on('joinRide', ({ rideId }) => {
    socket.join(rideId);
    socket.emit('joinedRide', { rideId });
    console.log(`🔹 Socket ${socket.id} joined room ${rideId}`);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
