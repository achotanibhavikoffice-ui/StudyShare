import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const cloudinaryOn = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY &&
     process.env.CLOUDINARY_API_SECRET && !['demo', 'your_cloud_name'].includes(process.env.CLOUDINARY_CLOUD_NAME));

// Uploads to Cloudinary when configured, otherwise saves to server/uploads
export async function uploadFile(file) {
  if (cloudinaryOn()) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'studyshare', resource_type: 'auto', use_filename: true }, (err, r) =>
          err ? reject(err) : resolve(r.secure_url))
        .end(file.buffer);
    });
  }
  const dir = path.join(__dirname, 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  const name = crypto.randomBytes(8).toString('hex') + path.extname(file.originalname || '');
  fs.writeFileSync(path.join(dir, name), file.buffer);
  return `/uploads/${name}`;
}
