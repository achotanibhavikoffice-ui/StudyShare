import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Resource from './models/Resource.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function seed({ reset = false } = {}) {
  if (reset) await Promise.all([User.deleteMany(), Resource.deleteMany()]);
  const pw = await bcrypt.hash('password123', 10);
  await User.create({ name: 'Admin', email: 'admin@studyshare.dev', role: 'admin', password: await bcrypt.hash('admin123', 10) });
  const [jiya, aarav, diya] = await User.insertMany([
    { name: 'Jiya Aswani', email: 'jiya@demo.dev', department: 'Computer Engineering', password: pw },
    { name: 'Aarav Sharma', email: 'aarav@demo.dev', department: 'Information Technology', password: pw },
    { name: 'Diya Patel', email: 'diya@demo.dev', department: 'Computer Engineering', password: pw },
  ]);

  const dir = path.join(__dirname, 'uploads');
  fs.mkdirSync(dir, { recursive: true });
  const items = [
    ['Data Structures - Unit 1 Notes', 'Arrays, linked lists and complexity, handwritten and typed.', 'Data Structures', 3, 'Notes', '2025-26', jiya],
    ['DBMS Previous Year Paper (Dec 2024)', 'End semester paper with solutions to Q1-Q4.', 'DBMS', 4, 'Question Paper', '2024-25', aarav],
    ['Operating Systems Lab Manual', 'All 10 experiments with sample output.', 'Operating Systems', 5, 'Lab Manual', '2025-26', diya],
    ['Computer Networks Assignment 2', 'Subnetting and routing problems with answers.', 'Computer Networks', 5, 'Assignment', '2025-26', jiya],
    ['ROSPL Mini Project Report Template', 'Report format followed by the department.', 'ROSPL', 6, 'Project', '2025-26', aarav],
    ['Engineering Mathematics III Formula Sheet', 'One-page summary of Laplace and Fourier formulas.', 'Engineering Mathematics', 3, 'Reference', '2024-25', diya],
  ];
  for (const [i, [title, description, subject, semester, category, academicYear, u]] of items.entries()) {
    const name = `sample-${i + 1}.txt`;
    fs.writeFileSync(path.join(dir, name), `${title}\n\nSample StudyShare file for demo purposes.\n`);
    await Resource.create({
      title, description, subject, semester, category, academicYear, uploader: u._id,
      fileUrl: `/uploads/${name}`, fileName: name, fileType: 'text/plain', fileSize: 120, downloads: (i * 7) % 23,
    });
  }
}

export async function seedIfEmpty() {
  if ((await User.countDocuments()) === 0) {
    await seed();
    console.log('Mock data added. Login: jiya@demo.dev / password123  |  admin@studyshare.dev / admin123');
  }
}
