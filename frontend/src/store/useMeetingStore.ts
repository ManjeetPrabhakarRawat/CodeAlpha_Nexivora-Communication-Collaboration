import { create } from 'zustand';
import api from '../services/api';

interface MeetingState {
  currentMeeting: any;
  recentMeetings: any[];
  isLoading: boolean;
  createMeeting: (title: string) => Promise<any>;
  joinMeeting: (roomId: string) => Promise<any>;
  fetchRecentMeetings: () => Promise<void>;
  leaveMeeting: () => void;
}

export const useMeetingStore = create<MeetingState>((set) => ({
  currentMeeting: null,
  recentMeetings: [],
  isLoading: false,

  createMeeting: async (title) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/meetings', { title });
      set({ currentMeeting: data, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  joinMeeting: async (roomId) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/meetings/${roomId}`);
      set({ currentMeeting: data, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchRecentMeetings: async () => {
    try {
      const { data } = await api.get('/meetings/history');
      set({ recentMeetings: data });
    } catch (error) {
      console.error(error);
    }
  },

  leaveMeeting: () => {
    set({ currentMeeting: null });
  }
}));
