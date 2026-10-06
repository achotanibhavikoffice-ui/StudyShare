import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function connectDB() {
  let uri = process.env.MONGO_URI;
  try {
    if (!uri) {
      // No Atlas URI: run a local MongoDB whose data is saved in server/.data/db,
      // so accounts and uploads survive restarts.
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const dbPath = path.join(__dirname, '..', '.data', 'db');
      fs.mkdirSync(dbPath, { recursive: true });
      const mongod = await MongoMemoryServer.create({ instance: { dbPath, storageEngine: 'wiredTiger' } });
      uri = mongod.getUri('studyshare');
      const stop = async () => { await mongod.stop({ doCleanup: false }); process.exit(0); };
      process.on('SIGINT', stop);
      process.on('SIGTERM', stop);
      console.log('MONGO_URI empty -> using local MongoDB, data saved in server/.data/db');
    }
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log('MongoDB connected');
  } catch (e) {
    console.error('MongoDB connection failed:', e.message);
    console.error('Check: Atlas Network Access (IP allow list), DB name in URI, URL-encoded password, or try a mobile hotspot.');
    process.exit(1);
  }
}
