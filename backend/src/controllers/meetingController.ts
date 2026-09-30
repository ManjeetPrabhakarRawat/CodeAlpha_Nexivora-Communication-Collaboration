import { Response } from 'express';
import { Meeting } from '../models/Meeting';
import { Message } from '../models/Message';
import { AuthRequest } from '../middleware/authMiddleware';

export const createMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title } = req.body;
    const roomId = Math.random().toString(36).substring(2, 9); // Generate a simple room ID

    const meeting = await Meeting.create({
      roomId,
      title: title || 'New Meeting',
      host: req.user._id,
      participants: [req.user._id]
    });

    res.status(201).json(meeting);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId }).populate('host', 'name avatar');
    
    if (meeting) {
      // Add user to participants if not already
      if (!meeting.participants.includes(req.user._id)) {
        meeting.participants.push(req.user._id);
        await meeting.save();
      }
      res.json(meeting);
    } else {
      res.status(404).json({ message: 'Meeting not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meetings = await Meeting.find({ participants: req.user._id }).sort({ createdAt: -1 });
    res.json(meetings);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getMeetingMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const messages = await Message.find({ meetingId: req.params.meetingId })
      .populate('sender', 'name avatar')
      .sort({ timestamp: 1 });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
