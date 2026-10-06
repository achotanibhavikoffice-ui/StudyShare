import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { seed } from './seedData.js';

await connectDB();
await seed({ reset: true });
console.log('Database reset and seeded. Login: jiya@demo.dev / password123  |  admin@studyshare.dev / admin123');
await mongoose.disconnect();
