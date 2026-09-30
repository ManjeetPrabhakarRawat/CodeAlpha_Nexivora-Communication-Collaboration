import { useState, useEffect, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';
import api from '../services/api';
import socket from '../services/socket';
import { useAuthStore } from '../store/useAuthStore';

interface Message {
  _id: string;
  meetingId: string;
  sender: {
    _id: string;
    name: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
}

interface ChatProps {
  roomId: string;
  meetingId: string;
}

export default function Chat({ roomId, meetingId }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const { data } = await api.get(`/meetings/${meetingId}/messages`);
        setMessages(data);
      } catch (error) {
        console.error('Failed to load messages', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();

    socket.on('receive-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      setTypingUser(null);
    });
    
    socket.on('user-typing', (userName: string) => {
      setTypingUser(userName);
    });
    
    socket.on('user-stop-typing', () => {
      setTypingUser(null);
    });

    return () => {
      socket.off('receive-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
    };
  }, [meetingId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    socket.emit('send-message', {
      roomId,
      meetingId,
      content: newMessage,
      sender: user
    });

    socket.emit('stop-typing', roomId);
    setNewMessage('');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (user) {
      socket.emit('typing', { roomId, userName: user.name });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop-typing', roomId);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-10">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => {
          const isMe = msg.sender._id === user?._id;
          return (
            <div key={msg._id || index} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="text-xs text-gray-400 mb-1 flex items-center gap-2">
                {!isMe && <span className="font-medium text-gray-300">{msg.sender.name}</span>}
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div 
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  isMe ? 'bg-brand-600 text-white rounded-br-none' : 'bg-navy-700 text-white rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        }))}
        {typingUser && (
          <div className="text-xs text-gray-400 italic">
            {typingUser} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/5 bg-navy-900">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 bg-navy-950 border border-white/10 rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="absolute right-1 w-8 h-8 rounded-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4 text-white ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
