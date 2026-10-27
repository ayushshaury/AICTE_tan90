import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { AppError } from './errors.js';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './private-uploads';
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_MB || '20', 10);

// Ensure private upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    // Generate an unguessable UUID-based filename to prevent path traversal
    const uniqueSuffix = crypto.randomUUID();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Only PDF, JPEG, and PNG documents are accepted.', 400, 'UNSUPPORTED_FILE_TYPE'));
    }
  },
});

export function calculateFileSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

export function getPrivateFilePath(storageKey: string): string {
  // Prevent any path traversal
  const safeFilename = path.basename(storageKey);
  return path.resolve(UPLOAD_DIR, safeFilename);
}

export function deletePrivateFile(storageKey: string): void {
  try {
    const filePath = getPrivateFilePath(storageKey);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error(`Failed to delete private file: ${storageKey}`, err);
  }
}
