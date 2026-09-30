import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMeetingStore } from '../store/useMeetingStore';
import { useAuthStore } from '../store/useAuthStore';
import { useWebRTC } from '../hooks/useWebRTC';
import socket from '../services/socket';

import VideoPlayer from '../components/VideoPlayer';
import Chat from '../components/Chat';
import Whiteboard from '../components/Whiteboard';
import FileSharing from '../components/FileSharing';

import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  MessageSquare,
  PenTool,
  Users,
  LogOut,
  Files,
  Settings,
  X,
  Copy,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function MeetingRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const { user } = useAuthStore();
  const { joinMeeting, currentMeeting, leaveMeeting } = useMeetingStore();

  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'chat' | 'participants' | 'files' | 'whiteboard' | null
  >(null);

  const [screenStream, setScreenStream] =
    useState<MediaStream | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  // SETTINGS
  const [showSettings, setShowSettings] = useState(false);
  const [speakerMuted, setSpeakerMuted] = useState(false);

  const {
    localStream,
    remoteStreams,
    participants,
  } = useWebRTC(
    roomId!,
    isMicEnabled,
    isCameraEnabled
  );

  useEffect(() => {
    if (roomId) {
      joinMeeting(roomId).catch(() => {
        navigate('/dashboard');
      });
    }
  }, [roomId, joinMeeting, navigate]);

  const toggleMic = () => {
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];

    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;

      setIsMicEnabled(audioTrack.enabled);

      socket.emit('toggle-media', {
        roomId,
        type: 'audio',
        isEnabled: audioTrack.enabled,
        userId: user?._id,
      });
    }
  };

  const toggleCamera = () => {
    if (!localStream) return;

    const videoTrack = localStream.getVideoTracks()[0];

    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;

      setIsCameraEnabled(videoTrack.enabled);

      socket.emit('toggle-media', {
        roomId,
        type: 'video',
        isEnabled: videoTrack.enabled,
        userId: user?._id,
      });
    }
  };

  const handleLeaveMeeting = () => {
    leaveMeeting();
    navigate('/dashboard');
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const stream =
          await navigator.mediaDevices.getDisplayMedia({
            video: true,
          });

        setScreenStream(stream);
        setIsScreenSharing(true);

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };

        socket.emit('toggle-screen-share', {
          roomId,
          isSharing: true,
          userId: user?._id,
        });
      } catch (err) {
        console.error('Error sharing screen', err);
      }
    } else {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => {
          track.stop();
        });

        setScreenStream(null);
      }

      setIsScreenSharing(false);

      socket.emit('toggle-screen-share', {
        roomId,
        isSharing: false,
        userId: user?._id,
      });
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/meeting/${roomId}`;

    navigator.clipboard.writeText(link);

    setCopiedLink(true);

    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  const totalVideos = remoteStreams.length + 1;

  const gridCols =
    totalVideos === 1
      ? 'grid-cols-1'
      : totalVideos <= 2
      ? 'grid-cols-1 md:grid-cols-2'
      : totalVideos <= 4
      ? 'grid-cols-2'
      : totalVideos <= 6
      ? 'grid-cols-2 md:grid-cols-3'
      : 'grid-cols-3 md:grid-cols-4';

  if (!currentMeeting) {
    return (
      <div className="h-screen flex items-center justify-center bg-navy-950 text-white">
        Connecting...
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-navy-950 flex flex-col text-white overflow-hidden relative">

      {/* ================= TOP HEADER ================= */}
      <header className="h-12 min-h-12 border-b border-white/5 flex items-center justify-between px-4 bg-navy-900 shrink-0">

        <div className="flex items-center gap-3 min-w-0">

          <div className="font-bold text-lg truncate">
            {currentMeeting.title}
          </div>

          <div className="flex items-center bg-white/10 rounded-full text-xs font-medium text-gray-300 overflow-hidden shrink-0">

            <span className="px-2.5 py-1 border-r border-white/10">
              {roomId}
            </span>

            <button
              onClick={copyInviteLink}
              className="px-2.5 py-1 hover:bg-white/10 transition-colors flex items-center gap-1"
              aria-label="Copy invitation link"
            >
              {copiedLink ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}

              <span>
                {copiedLink ? 'Copied' : 'Copy Link'}
              </span>
            </button>

          </div>
        </div>

      </header>


      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 min-h-0 flex overflow-hidden">

        {/* VIDEO AREA */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col relative overflow-hidden">

          {activeTab === 'whiteboard' ? (

            <div className="flex-1 min-h-0 min-w-0 bg-navy-900 rounded-xl border border-white/10 overflow-hidden relative m-2">

              <Whiteboard roomId={roomId!} />

              <button
                onClick={() => setActiveTab(null)}
                className="absolute top-3 right-3 bg-navy-800 p-2 rounded-full border border-white/10 hover:bg-navy-700"
              >
                <X className="w-5 h-5" />
              </button>

            </div>

          ) : (

            <div
              className={`
                flex-1
                min-h-0
                min-w-0
                grid
                ${gridCols}
                gap-2
                p-2
                overflow-hidden
                auto-rows-fr
              `}
            >

              {/* LOCAL VIDEO */}
              <div className="min-h-0 min-w-0 rounded-xl overflow-hidden border border-white/10 bg-black">

                <VideoPlayer
                  stream={
                    isScreenSharing && screenStream
                      ? screenStream
                      : localStream
                  }
                  name={user?.name || ''}
                  isLocal={true}
                  isMuted={!isMicEnabled}
                />

              </div>


              {/* REMOTE VIDEOS */}
              {remoteStreams.map((remote) => (

                <div
                  key={remote.socketId}
                  className="min-h-0 min-w-0 rounded-xl overflow-hidden border border-white/10 bg-black"
                >

                  <VideoPlayer
                    stream={remote.stream}
                    name={remote.user?.name || 'Participant'}
                  />

                </div>

              ))}

            </div>

          )}

        </div>


        {/* ================= RIGHT PANEL ================= */}
        {activeTab && activeTab !== 'whiteboard' && (

          <div className="w-72 border-l border-white/5 bg-navy-900 flex flex-col shrink-0">

            <div className="h-12 border-b border-white/5 flex items-center justify-between px-4">

              <h3 className="font-medium capitalize">
                {activeTab}
              </h3>

              <button
                onClick={() => setActiveTab(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

            </div>


            <div className="flex-1 overflow-y-auto">

              {activeTab === 'chat' && (
                <Chat
                  roomId={roomId!}
                  meetingId={currentMeeting._id}
                />
              )}

              {activeTab === 'participants' && (

                <div className="p-4 space-y-4">

                  <div className="flex items-center gap-3">

                    <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
                      {user?.name?.charAt(0)}
                    </div>

                    <div>
                      <div className="font-medium text-sm">
                        {user?.name} (You)
                      </div>
                    </div>

                  </div>

                  {participants.map((p) => (

                    <div
                      key={p.socketId}
                      className="flex items-center gap-3"
                    >

                      <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-sm font-bold">
                        {p.user?.name?.charAt(0)}
                      </div>

                      <div>
                        <div className="font-medium text-sm">
                          {p.user?.name}
                        </div>
                      </div>

                    </div>

                  ))}

                </div>

              )}

              {activeTab === 'files' && (
                <FileSharing
                  roomId={roomId!}
                  meetingId={currentMeeting._id}
                />
              )}

            </div>

          </div>

        )}

      </div>


      {/* ================= SETTINGS PANEL ================= */}
      {showSettings && (

        <div
          className="absolute inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
          onClick={() => setShowSettings(false)}
        >

          <div
            className="absolute right-4 bottom-20 w-80 bg-navy-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >

            {/* SETTINGS HEADER */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-white/10">

              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-brand-400" />

                <h3 className="font-semibold">
                  Meeting Settings
                </h3>
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>

            </div>


            {/* SETTINGS BODY */}
            <div className="p-4 space-y-3">

              {/* MICROPHONE */}
              <button
                onClick={toggleMic}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-navy-800 hover:bg-navy-700 transition-colors"
              >

                <div className="flex items-center gap-3">

                  {isMicEnabled ? (
                    <Mic className="w-5 h-5 text-brand-400" />
                  ) : (
                    <MicOff className="w-5 h-5 text-red-400" />
                  )}

                  <div className="text-left">
                    <div className="text-sm font-medium">
                      Microphone
                    </div>

                    <div className="text-xs text-gray-400">
                      {isMicEnabled ? 'Enabled' : 'Muted'}
                    </div>
                  </div>

                </div>

                <div
                  className={`w-9 h-5 rounded-full ${
                    isMicEnabled
                      ? 'bg-brand-500'
                      : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${
                      isMicEnabled
                        ? 'translate-x-4'
                        : 'translate-x-0.5'
                    }`}
                  />
                </div>

              </button>


              {/* CAMERA */}
              <button
                onClick={toggleCamera}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-navy-800 hover:bg-navy-700 transition-colors"
              >

                <div className="flex items-center gap-3">

                  {isCameraEnabled ? (
                    <VideoIcon className="w-5 h-5 text-brand-400" />
                  ) : (
                    <VideoOff className="w-5 h-5 text-red-400" />
                  )}

                  <div className="text-left">
                    <div className="text-sm font-medium">
                      Camera
                    </div>

                    <div className="text-xs text-gray-400">
                      {isCameraEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>

                </div>

                <div
                  className={`w-9 h-5 rounded-full ${
                    isCameraEnabled
                      ? 'bg-brand-500'
                      : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${
                      isCameraEnabled
                        ? 'translate-x-4'
                        : 'translate-x-0.5'
                    }`}
                  />
                </div>

              </button>


              {/* SPEAKER */}
              <button
                onClick={() => setSpeakerMuted((prev) => !prev)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-navy-800 hover:bg-navy-700 transition-colors"
              >

                <div className="flex items-center gap-3">

                  {speakerMuted ? (
                    <VolumeX className="w-5 h-5 text-red-400" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-brand-400" />
                  )}

                  <div className="text-left">

                    <div className="text-sm font-medium">
                      Speaker
                    </div>

                    <div className="text-xs text-gray-400">
                      {speakerMuted
                        ? 'Muted'
                        : 'Enabled'}
                    </div>

                  </div>

                </div>

                <div
                  className={`w-9 h-5 rounded-full ${
                    speakerMuted
                      ? 'bg-gray-600'
                      : 'bg-brand-500'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full mt-0.5 transition-transform ${
                      speakerMuted
                        ? 'translate-x-0.5'
                        : 'translate-x-4'
                    }`}
                  />
                </div>

              </button>


              {/* CLOSE */}
              <button
                onClick={() => setShowSettings(false)}
                className="w-full mt-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors"
              >
                Close Settings
              </button>

            </div>

          </div>

        </div>

      )}


      {/* ================= BOTTOM CONTROLS ================= */}
      <footer className="h-16 min-h-16 border-t border-white/5 bg-navy-900 flex items-center justify-center px-4 shrink-0 relative z-20">

        {/* TIME */}
        <div className="absolute left-4 text-xs text-gray-400 hidden md:block">
          {new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>


        {/* MAIN CONTROLS */}
        <div className="flex items-center gap-2">

          {/* MIC */}
          <button
            onClick={toggleMic}
            className={`
              w-10 h-10
              rounded-full
              flex
              items-center
              justify-center
              transition-colors
              ${
                isMicEnabled
                  ? 'bg-navy-700 hover:bg-navy-600'
                  : 'bg-red-500 hover:bg-red-600'
              }
            `}
          >
            {isMicEnabled ? (
              <Mic className="w-4.5 h-4.5" />
            ) : (
              <MicOff className="w-4.5 h-4.5" />
            )}
          </button>


          {/* CAMERA */}
          <button
            onClick={toggleCamera}
            className={`
              w-10 h-10
              rounded-full
              flex
              items-center
              justify-center
              transition-colors
              ${
                isCameraEnabled
                  ? 'bg-navy-700 hover:bg-navy-600'
                  : 'bg-red-500 hover:bg-red-600'
              }
            `}
          >
            {isCameraEnabled ? (
              <VideoIcon className="w-4.5 h-4.5" />
            ) : (
              <VideoOff className="w-4.5 h-4.5" />
            )}
          </button>


          {/* SCREEN SHARE */}
          <button
            onClick={toggleScreenShare}
            className={`
              w-10 h-10
              rounded-full
              flex
              items-center
              justify-center
              transition-colors
              ${
                isScreenSharing
                  ? 'bg-brand-500 hover:bg-brand-600'
                  : 'bg-navy-700 hover:bg-navy-600'
              }
            `}
          >
            <MonitorUp className="w-4.5 h-4.5" />
          </button>

        </div>


        {/* DIVIDER */}
        <div className="w-px h-7 bg-white/10 mx-3" />


        {/* SECONDARY CONTROLS */}
        <div className="flex items-center gap-1">

          {/* CHAT */}
          <button
            onClick={() =>
              setActiveTab(
                activeTab === 'chat' ? null : 'chat'
              )
            }
            className={`
              p-2.5
              rounded-lg
              transition-colors
              ${
                activeTab === 'chat'
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'hover:bg-navy-800 text-gray-300'
              }
            `}
          >
            <MessageSquare className="w-5 h-5" />
          </button>


          {/* PARTICIPANTS */}
          <button
            onClick={() =>
              setActiveTab(
                activeTab === 'participants'
                  ? null
                  : 'participants'
              )
            }
            className={`
              p-2.5
              rounded-lg
              transition-colors
              ${
                activeTab === 'participants'
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'hover:bg-navy-800 text-gray-300'
              }
            `}
          >
            <Users className="w-5 h-5" />
          </button>


          {/* WHITEBOARD */}
          <button
            onClick={() =>
              setActiveTab(
                activeTab === 'whiteboard'
                  ? null
                  : 'whiteboard'
              )
            }
            className={`
              p-2.5
              rounded-lg
              transition-colors
              ${
                activeTab === 'whiteboard'
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'hover:bg-navy-800 text-gray-300'
              }
            `}
          >
            <PenTool className="w-5 h-5" />
          </button>


          {/* FILES */}
          <button
            onClick={() =>
              setActiveTab(
                activeTab === 'files'
                  ? null
                  : 'files'
              )
            }
            className={`
              p-2.5
              rounded-lg
              transition-colors
              ${
                activeTab === 'files'
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'hover:bg-navy-800 text-gray-300'
              }
            `}
          >
            <Files className="w-5 h-5" />
          </button>

        </div>


        {/* RIGHT SIDE */}
        <div className="absolute right-4 flex items-center gap-2">

          {/* SETTINGS */}
          <button
            onClick={() => setShowSettings((prev) => !prev)}
            className={`
              p-2.5
              rounded-lg
              transition-colors
              ${
                showSettings
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'hover:bg-navy-800 text-gray-300'
              }
            `}
            aria-label="Meeting settings"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>


          {/* LEAVE */}
          <button
            onClick={handleLeaveMeeting}
            className="
              bg-red-500
              hover:bg-red-600
              text-white
              px-4
              py-2
              rounded-lg
              text-sm
              font-medium
              transition-colors
              flex
              items-center
              gap-2
            "
          >
            <LogOut className="w-4 h-4" />

            <span className="hidden sm:inline">
              Leave
            </span>
          </button>

        </div>

      </footer>

    </div>
  );
}