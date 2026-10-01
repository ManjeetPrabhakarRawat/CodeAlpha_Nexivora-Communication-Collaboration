import { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../services/socket';
import { useAuthStore } from '../store/useAuthStore';

interface PeerConnectionMap {
  [socketId: string]: RTCPeerConnection;
}

interface RemoteStream {
  socketId: string;
  stream: MediaStream;
  user: any;
}

export function useWebRTC(
  roomId: string,
  isMicEnabled: boolean,
  isCameraEnabled: boolean
) {
  const { user } = useAuthStore();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [participants, setParticipants] = useState<
    { socketId: string; user: any }[]
  >([]);

  const peersRef = useRef<PeerConnectionMap>({});
  const localStreamRef = useRef<MediaStream | null>(null);

  // Keep latest media state without restarting WebRTC
  const micEnabledRef = useRef(isMicEnabled);
  const cameraEnabledRef = useRef(isCameraEnabled);

  // --------------------------------------------------
  // Update microphone track
  // --------------------------------------------------

  useEffect(() => {
    micEnabledRef.current = isMicEnabled;

    const stream = localStreamRef.current;

    if (!stream) return;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = isMicEnabled;
    });
  }, [isMicEnabled]);

  // --------------------------------------------------
  // Update camera track
  // --------------------------------------------------

  useEffect(() => {
    cameraEnabledRef.current = isCameraEnabled;

    const stream = localStreamRef.current;

    if (!stream) return;

    stream.getVideoTracks().forEach((track) => {
      track.enabled = isCameraEnabled;
    });
  }, [isCameraEnabled]);

  // --------------------------------------------------
  // STUN / TURN configuration
  // --------------------------------------------------

  const ICE_SERVERS = {
    iceServers: [
      {
        urls:
          import.meta.env.VITE_STUN_SERVER ||
          'stun:stun.l.google.com:19302',
      },

      ...(import.meta.env.VITE_TURN_SERVER
        ? [
            {
              urls: import.meta.env.VITE_TURN_SERVER,
              username: import.meta.env.VITE_TURN_USERNAME,
              credential: import.meta.env.VITE_TURN_CREDENTIAL,
            },
          ]
        : []),
    ],
  };

  // --------------------------------------------------
  // Create WebRTC peer
  // --------------------------------------------------

  const createPeerConnection = useCallback(
    (
      targetSocketId: string,
      targetUser: any,
      stream: MediaStream
    ) => {
      // Reuse existing connection
      const existingPeer = peersRef.current[targetSocketId];

      if (existingPeer) {
        return existingPeer;
      }

      const peer = new RTCPeerConnection(ICE_SERVERS);

      // Add local audio/video tracks
      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      // Receive remote stream
      peer.ontrack = (event) => {
        const remoteStream = event.streams[0];

        if (!remoteStream) return;

        setRemoteStreams((prev) => {
          const existing = prev.find(
            (item) => item.socketId === targetSocketId
          );

          if (existing) {
            return prev.map((item) =>
              item.socketId === targetSocketId
                ? {
                    ...item,
                    stream: remoteStream,
                  }
                : item
            );
          }

          return [
            ...prev,
            {
              socketId: targetSocketId,
              stream: remoteStream,
              user: targetUser,
            },
          ];
        });
      };

      // ICE candidate
      peer.onicecandidate = (event) => {
        if (!event.candidate) return;

        socket.emit('ice-candidate', {
          target: targetSocketId,
          candidate: event.candidate,
          caller: socket.id,
        });
      };

      // Connection state
      peer.onconnectionstatechange = () => {
        const state = peer.connectionState;

        if (
          state === 'failed' ||
          state === 'closed' ||
          state === 'disconnected'
        ) {
          setRemoteStreams((prev) =>
            prev.filter(
              (item) => item.socketId !== targetSocketId
            )
          );
        }
      };

      peersRef.current[targetSocketId] = peer;

      return peer;
    },
    []
  );

  // --------------------------------------------------
  // Initialize camera/mic + socket
  // IMPORTANT: This does NOT depend on camera/mic state
  // --------------------------------------------------

  const initialize = useCallback(async () => {
    // Wait until authentication state is restored
    if (!user?._id) {
      console.log('Waiting for authenticated user...');
      return;
    }

    try {
      let stream = localStreamRef.current;

      // Only request camera/mic once
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        // Apply current camera state
        stream.getVideoTracks().forEach((track) => {
          track.enabled = cameraEnabledRef.current;
        });

        // Apply current microphone state
        stream.getAudioTracks().forEach((track) => {
          track.enabled = micEnabledRef.current;
        });

        localStreamRef.current = stream;
        setLocalStream(stream);
      }

      // Connect socket if needed
      if (!socket.connected) {
        socket.connect();
      }

      // Join room
      const joinRoom = () => {
        if (!user?._id) {
          console.error(
            'Cannot join meeting: user is not available'
          );
          return;
        }

        socket.emit('join-room', roomId, user);
      };

      if (socket.connected) {
        joinRoom();
      } else {
        socket.once('connect', joinRoom);
      }
    } catch (error) {
      console.error(
        'Error accessing camera/microphone:',
        error
      );

      // Still connect to socket if media permission fails
      if (!socket.connected) {
        socket.connect();
      }

      const joinRoom = () => {
        if (!user?._id) {
          console.error(
            'Cannot join meeting: user is not available'
          );
          return;
        }

        socket.emit('join-room', roomId, user);
      };

      if (socket.connected) {
        joinRoom();
      } else {
        socket.once('connect', joinRoom);
      }
    }
  }, [roomId, user]);

  // --------------------------------------------------
  // Main WebRTC effect
  // --------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    // ------------------------------------------------
    // Existing participants
    // ------------------------------------------------

    const handleRoomParticipants = async (
      existingParticipants: any[]
    ) => {
      if (!isMounted) return;

      setParticipants(existingParticipants);

      const stream = localStreamRef.current;

      if (!stream) return;

      for (const participant of existingParticipants) {
        try {
          if (!isMounted) return;

          const peer = createPeerConnection(
            participant.socketId,
            participant.user,
            stream
          );

          // Only create offer for a new connection
          if (peer.signalingState !== 'stable') {
            continue;
          }

          const offer = await peer.createOffer();

          await peer.setLocalDescription(offer);

          socket.emit('offer', {
            target: participant.socketId,
            caller: socket.id,
            sdp: offer,
            user,
          });
        } catch (error) {
          console.error(
            'Error creating offer:',
            error
          );
        }
      }
    };

    // ------------------------------------------------
    // New user connected
    // ------------------------------------------------

    const handleUserConnected = ({
      socketId,
      user: newUser,
    }: any) => {
      if (!isMounted) return;

      setParticipants((prev) => {
        if (
          prev.some(
            (participant) =>
              participant.socketId === socketId
          )
        ) {
          return prev;
        }

        return [
          ...prev,
          {
            socketId,
            user: newUser,
          },
        ];
      });
    };

    // ------------------------------------------------
    // Receive offer
    // ------------------------------------------------

    const handleOffer = async ({
      caller,
      sdp,
      user: callerUser,
    }: any) => {
      const stream = localStreamRef.current;

      if (!stream) return;

      try {
        const peer = createPeerConnection(
          caller,
          callerUser,
          stream
        );

        await peer.setRemoteDescription(
          new RTCSessionDescription(sdp)
        );

        const answer = await peer.createAnswer();

        await peer.setLocalDescription(answer);

        socket.emit('answer', {
          target: caller,
          caller: socket.id,
          sdp: answer,
        });
      } catch (error) {
        console.error(
          'Error handling offer:',
          error
        );
      }
    };

    // ------------------------------------------------
    // Receive answer
    // ------------------------------------------------

    const handleAnswer = async ({
      caller,
      sdp,
    }: any) => {
      const peer = peersRef.current[caller];

      if (!peer) return;

      try {
        await peer.setRemoteDescription(
          new RTCSessionDescription(sdp)
        );
      } catch (error) {
        console.error(
          'Error handling answer:',
          error
        );
      }
    };

    // ------------------------------------------------
    // ICE candidate
    // ------------------------------------------------

    const handleIceCandidate = async ({
      caller,
      candidate,
    }: any) => {
      const peer = peersRef.current[caller];

      if (!peer || !candidate) return;

      try {
        await peer.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error(
          'Error adding ICE candidate:',
          error
        );
      }
    };

    // ------------------------------------------------
    // User disconnected
    // ------------------------------------------------

    const handleUserDisconnected = (
      socketId: string
    ) => {
      const peer = peersRef.current[socketId];

      if (peer) {
        peer.close();
        delete peersRef.current[socketId];
      }

      setRemoteStreams((prev) =>
        prev.filter(
          (item) => item.socketId !== socketId
        )
      );

      setParticipants((prev) =>
        prev.filter(
          (participant) =>
            participant.socketId !== socketId
        )
      );
    };

    // ------------------------------------------------
    // Register socket events BEFORE initialize
    // ------------------------------------------------

    socket.on(
      'room-participants',
      handleRoomParticipants
    );

    socket.on(
      'user-connected',
      handleUserConnected
    );

    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);

    socket.on(
      'ice-candidate',
      handleIceCandidate
    );

    socket.on(
      'user-disconnected',
      handleUserDisconnected
    );

    // IMPORTANT:
    // Listeners must be registered before connecting/joining
    initialize();

    // ------------------------------------------------
    // Cleanup
    // ------------------------------------------------

    return () => {
      isMounted = false;

      socket.off(
        'room-participants',
        handleRoomParticipants
      );

      socket.off(
        'user-connected',
        handleUserConnected
      );

      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);

      socket.off(
        'ice-candidate',
        handleIceCandidate
      );

      socket.off(
        'user-disconnected',
        handleUserDisconnected
      );

      // Close peer connections
      Object.values(peersRef.current).forEach(
        (peer) => {
          try {
            peer.close();
          } catch {
            // Ignore cleanup errors
          }
        }
      );

      peersRef.current = {};

      // Stop camera/microphone ONLY when
      // the meeting component is actually unmounted
      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        localStreamRef.current = null;
      }

      setLocalStream(null);

      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [
    roomId,
    user,
    initialize,
    createPeerConnection,
  ]);

  return {
    localStream,
    remoteStreams,
    participants,
  };
}