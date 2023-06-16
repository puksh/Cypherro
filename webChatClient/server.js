// Import the required libraries
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

// Set up the Express app
const app = express();
const server = http.createServer(app);

// Set up the Socket.IO server
const io = socketIO(server);

// Event handler for new socket connections
io.on('connection', (socket) => {
  console.log('A user connected.');

  // Event handler for peer discovery message
  socket.on('peer-discovery', (peerId) => {
    console.log('Peer discovered:', peerId);
    // Broadcast the peer ID to all connected sockets except the sender
    socket.broadcast.emit('peer-discovery', peerId);
  });

  // Event handler for socket disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected.');
  });
});

// Start the server
const port = 3000; // Replace with the appropriate port number
server.listen(port, () => {
  console.log(`Signaling server is running on port ${port}`);
});
