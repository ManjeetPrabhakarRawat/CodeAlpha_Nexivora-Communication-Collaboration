import { Server, Socket } from 'socket.io';
import { Message } from '../models/Message';

const users: Record<string, any> = {};
const rooms: Record<string, string[]> = {};

export default function setupSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-room', (roomId: string, user: any) => {
      socket.join(roomId);
      users[socket.id] = { ...user, roomId };
      
      if (!rooms[roomId]) {
        rooms[roomId] = [];
      }
      rooms[roomId].push(socket.id);

      // Notify others in room
      socket.to(roomId).emit('user-connected', {
        userId: user._id,
        socketId: socket.id,
        user
      });

      // Send existing participants to the joined user
      const participantsInRoom = rooms[roomId]
        .filter(id => id !== socket.id)
        .map(id => ({
          socketId: id,
          user: users[id]
        }));
      
      socket.emit('room-participants', participantsInRoom);
    });

    // WebRTC Signaling
    socket.on('offer', (payload: { target: string, caller: string, sdp: RTCSessionDescriptionInit, user: any }) => {
      io.to(payload.target).emit('offer', payload);
    });

    socket.on('answer', (payload: { target: string, caller: string, sdp: RTCSessionDescriptionInit }) => {
      io.to(payload.target).emit('answer', payload);
    });

    socket.on('ice-candidate', (payload: { target: string, candidate: RTCIceCandidateInit, caller: string }) => {
      io.to(payload.target).emit('ice-candidate', payload);
    });

    // Chat
    socket.on('typing', (data: { roomId: string, userName: string }) => {
      socket.to(data.roomId).emit('user-typing', data.userName);
    });

    socket.on('stop-typing', (roomId: string) => {
      socket.to(roomId).emit('user-stop-typing');
    });

    socket.on('send-message', async (data: { roomId: string, meetingId: string, content: string, sender: any }) => {
      try {
        const message = await Message.create({
          meetingId: data.meetingId,
          sender: data.sender._id,
          content: data.content
        });
        
        io.to(data.roomId).emit('receive-message', {
          _id: message._id,
          meetingId: data.meetingId,
          sender: data.sender,
          content: data.content,
          timestamp: message.timestamp
        });
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

    // Whiteboard
    socket.on('draw', (data: { roomId: string, drawData: any }) => {
      socket.to(data.roomId).emit('draw', data.drawData);
    });

    socket.on('clear-board', (roomId: string) => {
      socket.to(roomId).emit('clear-board');
    });

    // File Sharing
    socket.on('file-shared', (data: { roomId: string, file: any }) => {
      socket.to(data.roomId).emit('file-shared', data.file);
    });
    
    // Screen sharing
    socket.on('toggle-screen-share', (data: { roomId: string, isSharing: boolean, userId: string }) => {
      socket.to(data.roomId).emit('user-screen-share-changed', data);
    });
    
    // Video/Audio toggle
    socket.on('toggle-media', (data: { roomId: string, type: 'video' | 'audio', isEnabled: boolean, userId: string }) => {
      socket.to(data.roomId).emit('user-media-changed', data);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      const user = users[socket.id];
      if (user) {
        const roomId = user.roomId;
        socket.to(roomId).emit('user-disconnected', socket.id);
        
        if (rooms[roomId]) {
          rooms[roomId] = rooms[roomId].filter(id => id !== socket.id);
          if (rooms[roomId].length === 0) {
            delete rooms[roomId];
          }
        }
        delete users[socket.id];
      }
    });
  });
}
