import { useEffect, useRef } from 'react';
import { MicOff, VideoOff } from 'lucide-react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isMuted?: boolean;
  name: string;
  isLocal?: boolean;
}

export default function VideoPlayer({
  stream,
  isMuted = false,
  name,
  isLocal = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoTrack = stream?.getVideoTracks()[0];
  const isVideoEnabled = videoTrack?.enabled ?? false;

  useEffect(() => {
    const video = videoRef.current;

    if (!video || !stream) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    video.play().catch(() => {});
  }, [stream]);

  return (
    <div className="relative w-full h-full min-h-0 bg-navy-800 rounded-xl overflow-hidden border border-white/5 flex items-center justify-center">
      {/* Video */}
      {stream && isVideoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${
            isLocal ? 'scale-x-[-1]' : ''
          }`}
        />
      ) : (
        /* Camera OFF screen */
        <div className="w-full h-full flex flex-col items-center justify-center bg-navy-900">
          <div className="w-20 h-20 rounded-full bg-brand-600 flex items-center justify-center text-2xl font-bold">
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="mt-4 flex items-center gap-2 text-gray-300 text-sm">
            <VideoOff className="w-4 h-4" />
            <span>Camera off</span>
          </div>
        </div>
      )}

      {/* Name */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
        <div className="bg-navy-900/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium">
          {name} {isLocal && '(You)'}
        </div>

        {isMuted && (
          <div className="bg-red-500/80 backdrop-blur-sm p-1.5 rounded-lg">
            <MicOff className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}