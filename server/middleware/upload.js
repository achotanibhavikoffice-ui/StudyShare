import multer from 'multer';

const ALLOWED = /pdf|msword|officedocument|text\/plain|image\/|zip|powerpoint|excel/i;

export default multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.test(file.mimetype) ? cb(null, true) : cb(new Error('Allowed files: PDF, Word, PowerPoint, Excel, text, images, zip')),
});
