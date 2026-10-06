import express from 'express';
import User from '../models/User.js';
import Resource from '../models/Resource.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, adminOnly, async (_req, res) => res.json(await User.find().sort('-createdAt')));

router.get('/stats', protect, adminOnly, async (_req, res) => {
  const [users, resources, dl] = await Promise.all([
    User.countDocuments(),
    Resource.countDocuments(),
    Resource.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }]),
  ]);
  res.json({ users, resources, downloads: dl[0]?.total || 0 });
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ message: 'You cannot delete your own account' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  await Resource.deleteMany({ uploader: user._id });
  await user.deleteOne();
  res.json({ message: 'User and their uploads removed' });
});

export default router;
