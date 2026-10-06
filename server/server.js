import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import resourceRoutes from './routes/resources.js';
import { seedIfEmpty } from './seedData.js';
import { cloudinaryOn } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET missing. Copy .env.example to .env first.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => res.json({ ok: true, cloudinary: cloudinaryOn() }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);

app.use((err, _req, res, _next) => {
  if (err.name === 'CastError') return res.status(404).json({ message: 'Not found' });
  if (err.name === 'MulterError') return res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'File is larger than 10 MB' : err.message });
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

await connectDB();
if (process.env.AUTO_SEED === 'true' || !process.env.MONGO_URI) await seedIfEmpty();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}  (file storage: ${cloudinaryOn() ? 'Cloudinary' : 'local disk'})`));
