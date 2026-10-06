import express from 'express';
import Resource, { CATEGORIES } from '../models/Resource.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { esc, uploadFile } from '../utils.js';

const router = express.Router();
const withUser = (q) => q.populate('uploader', 'name department');

router.get('/', async (req, res) => {
  const { q, subject, semester, category, year, sort } = req.query;
  const f = {};
  if (q) {
    const rx = new RegExp(esc(q), 'i');
    f.$or = [{ title: rx }, { description: rx }, { subject: rx }];
  }
  if (subject) f.subject = new RegExp('^' + esc(subject) + '$', 'i');
  if (semester) f.semester = Number(semester);
  if (category) f.category = category;
  if (year) f.academicYear = year;
  const order = sort === 'popular' ? '-downloads -createdAt' : '-createdAt';
  res.json(await withUser(Resource.find(f).sort(order).limit(100)));
});

router.get('/meta', async (_req, res) => {
  res.json({
    subjects: (await Resource.distinct('subject')).sort(),
    years: (await Resource.distinct('academicYear')).filter(Boolean).sort().reverse(),
    categories: CATEGORIES,
  });
});

router.get('/mine', protect, async (req, res) =>
  res.json(await withUser(Resource.find({ uploader: req.user.id }).sort('-createdAt'))));

router.post('/', protect, upload.single('file'), async (req, res) => {
  const { title, description, subject, semester, category, academicYear } = req.body;
  if (!title || !subject || !semester || !category)
    return res.status(400).json({ message: 'Title, subject, semester and category are required' });
  if (!CATEGORIES.includes(category)) return res.status(400).json({ message: 'Invalid category' });
  if (!req.file) return res.status(400).json({ message: 'Choose a file to upload' });
  const fileUrl = await uploadFile(req.file);
  const r = await Resource.create({
    title, description, subject, semester: Number(semester), category, academicYear,
    fileUrl, fileName: req.file.originalname, fileType: req.file.mimetype, fileSize: req.file.size,
    uploader: req.user.id,
  });
  res.status(201).json(r);
});

router.get('/:id', async (req, res) => {
  const r = await withUser(Resource.findById(req.params.id));
  if (!r) return res.status(404).json({ message: 'Resource not found' });
  res.json(r);
});

router.post('/:id/download', protect, async (req, res) => {
  const r = await Resource.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
  if (!r) return res.status(404).json({ message: 'Resource not found' });
  res.json({ url: r.fileUrl, fileName: r.fileName, downloads: r.downloads });
});

router.delete('/:id', protect, async (req, res) => {
  const r = await Resource.findById(req.params.id);
  if (!r) return res.status(404).json({ message: 'Resource not found' });
  if (String(r.uploader) !== req.user.id && req.user.role !== 'admin')
    return res.status(403).json({ message: 'Only the uploader or an admin can delete this' });
  await r.deleteOne();
  res.json({ message: 'Resource deleted' });
});

export default router;
