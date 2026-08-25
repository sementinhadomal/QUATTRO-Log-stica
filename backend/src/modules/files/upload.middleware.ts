import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
  'video/mp4'
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Basic distinction for folder - can be enhanced via req body or params if needed
    const type = file.mimetype.startsWith('image/') ? 'images' :
                 file.mimetype.startsWith('audio/') ? 'audio' :
                 file.mimetype.startsWith('video/') ? 'video' : 'docs';
                 
    const uploadPath = path.join(__dirname, '../../../uploads', type);
    
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024,
  }
});

export const uploadMiddleware = upload.single('file');
export const uploadMultiple = upload.array('files', 10);
