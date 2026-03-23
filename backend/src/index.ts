import dotenv from 'dotenv';
import app from './app';
import { testConnection } from './lib/db';

dotenv.config();
const PORT = process.env.PORT || 3000;

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Setup wizard available at http://localhost:${PORT}/api/auth/setup/init`);
  await testConnection().catch((err) => {
    console.error('❌ Failed to connect to PostgreSQL:', err.message);
    process.exit(1);
  });
});
