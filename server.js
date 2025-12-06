// Load environment variables from .env file
require('dotenv').config();

const { app, httpServer } = require('./app');

const PORT = process.env.PORT || 4000;

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`💡 Solutions:`);
    console.error(`   1. Kill the process using port ${PORT}:`);
    console.error(`      - Windows: netstat -ano | findstr :${PORT} then taskkill /F /PID <PID>`);
    console.error(`      - Mac/Linux: lsof -i :${PORT} then kill -9 <PID>`);
    console.error(`   2. Use a different port by setting PORT environment variable`);
    console.error(`   3. Close any other running instances of this server`);
    console.error(`   4. Run: npm run kill-port`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 GraphQL endpoint: http://localhost:${PORT}/graphql`);
  console.log(`🔗 WebSocket endpoint: ws://localhost:${PORT}/graphql`);
  console.log(`📍 Socket.io endpoint: http://localhost:${PORT}`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`⚠️  Note: Run 'npm install' in backend directory to install all dependencies`);
});
