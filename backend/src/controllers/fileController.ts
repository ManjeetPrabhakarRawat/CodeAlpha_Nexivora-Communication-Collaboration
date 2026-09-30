import { Response } from 'express';
import { FileModel } from '../models/File';
import { AuthRequest } from '../middleware/authMiddleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow most standard file types for a meeting, but block potential executables
  if (file.mimetype.includes('exe') || file.originalname.endsWith('.exe') || file.originalname.endsWith('.sh')) {
    cb(new Error('Invalid file type'));
  } else {
    cb(null, true);
  }
};

export const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter
});

export const uploadFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const { meetingId } = req.body;
    
    if (!meetingId) {
      res.status(400).json({ message: 'Meeting ID is required' });
      return;
    }

    const file = await FileModel.create({
      meetingId,
      uploader: req.user._id,
      filename: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      storagePath: req.file.path
    });

    const populatedFile = await file.populate('uploader', 'name avatar');

    res.status(201).json(populatedFile);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMeetingFiles = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = await FileModel.find({ meetingId: req.params.meetingId })
      .populate('uploader', 'name avatar')
      .sort({ uploadedAt: -1 });
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
