import http from 'http';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { wsManager } from './lib/websocket.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const app = createApp();
const server = http.createServer(app);

// Initialize real-time WebSocket server attached to HTTP server
wsManager.initialize(server);

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Syncro Backend Server listening on port ${PORT}`);
  console.log(`📡 HTTP API:      http://localhost:${PORT}/api/v1`);
  console.log(`⚡ WebSocket:     ws://localhost:${PORT}/ws`);
  console.log(`🏥 Health Check:  http://localhost:${PORT}/api/v1/health`);
  console.log(`===============================================`);
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('\nGracefully shutting down Syncro backend server...');
  server.close(() => {
    console.log('HTTP and WebSocket servers closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
