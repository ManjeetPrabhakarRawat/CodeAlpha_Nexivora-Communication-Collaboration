import express from 'express';
import { createMeeting, getMeeting, getUserMeetings, getMeetingMessages } from '../controllers/meetingController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', protect, createMeeting);
router.get('/history', protect, getUserMeetings);
router.get('/:roomId', protect, getMeeting);
router.get('/:meetingId/messages', protect, getMeetingMessages);

export default router;
