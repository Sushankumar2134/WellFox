require('dotenv').config();
const { initDatabase } = require('./config/database');

async function start() {
  await initDatabase();
  const app = require('./app');
  const PORT = process.env.PORT || 8000;
  const server = app.listen(PORT, () => {
    console.log(`Dental OCR API running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION:', err.message);
    server.close(() => process.exit(1));
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
