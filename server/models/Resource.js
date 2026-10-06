import mongoose from 'mongoose';

export const CATEGORIES = ['Notes', 'Question Paper', 'Assignment', 'Lab Manual', 'Project', 'Reference', 'Other'];

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '', maxlength: 600 },
    subject: { type: String, required: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 8 },
    category: { type: String, enum: CATEGORIES, required: true },
    academicYear: { type: String, default: '' },
    fileUrl: { type: String, required: true },
    fileName: { type: String, default: '' },
    fileType: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    downloads: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('Resource', schema);
