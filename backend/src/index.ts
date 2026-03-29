import dotenv from 'dotenv';
import app from './app';
import { testConnection } from './lib/db';
import { initializeBackupScheduler } from './lib/backupSchedule';
import { initializeComplianceScheduler } from './lib/complianceSchedule';
import { runStartupSchemaChecks } from './lib/startupSchema';

dotenv.config();
const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  try {
    await testConnection();
    await runStartupSchemaChecks();
    initializeBackupScheduler();
    initializeComplianceScheduler();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📋 Setup wizard available at http://localhost:${PORT}/api/auth/setup/init`);
    });
  } catch (err: any) {
    console.error('❌ Startup failed:', err?.message || err);
    process.exit(1);
  }
};

void startServer();
