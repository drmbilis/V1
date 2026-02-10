// Simple WebSocket implementation with Socket.IO
const { Server } = require('socket.io');

let io;

const initWebSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
    path: '/ws'
  });

  io.on('connection', (socket) => {
    console.log('WebSocket connected');
    socket.on('disconnect', () => console.log('WebSocket disconnected'));
  });

  return io;
};

const emitToTenant = (tenantId, event, data) => {
  if (io) io.to(`tenant:${tenantId}`).emit(event, data);
};

module.exports = { initWebSocket, emitToTenant };
