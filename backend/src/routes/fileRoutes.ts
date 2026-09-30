import express from 'express';
import { uploadFile, getMeetingFiles, upload } from '../controllers/fileController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/upload', protect, upload.single('file'), uploadFile);
router.get('/meeting/:meetingId', protect, getMeetingFiles);

export default router;
