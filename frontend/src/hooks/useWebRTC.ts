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

interface QueuedIceCandidates {
  [socketId: string]: RTCIceCandidateInit[];
}

export function useWebRTC(
  roomId: string,
  isMicEnabled: boolean,
  isCameraEnabled: boolean
) {
  const { user } = useAuthStore();

  const [localStream, setLocalStream] =
    useState<MediaStream | null>(null);

  const [remoteStreams, setRemoteStreams] =
    useState<RemoteStream[]>([]);

  const [participants, setParticipants] = useState<
    { socketId: string; user: any }[]
  >([]);

  const peersRef = useRef<PeerConnectionMap>({});

  const localStreamRef =
    useRef<MediaStream | null>(null);

  const userRef = useRef(user);

  const mountedRef = useRef(false);

  const joinedRoomRef = useRef(false);

  const pendingIceCandidatesRef =
    useRef<QueuedIceCandidates>({});

  const micEnabledRef = useRef(isMicEnabled);
  const cameraEnabledRef =
    useRef(isCameraEnabled);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // --------------------------------------------------
  // MEDIA STATE
  // --------------------------------------------------

  useEffect(() => {
    micEnabledRef.current = isMicEnabled;

    const stream = localStreamRef.current;

    if (!stream) return;

    stream.getAudioTracks().forEach((track) => {
      track.enabled = isMicEnabled;
    });
  }, [isMicEnabled]);

  useEffect(() => {
    cameraEnabledRef.current = isCameraEnabled;

    const stream = localStreamRef.current;

    if (!stream) return;

    stream.getVideoTracks().forEach((track) => {
      track.enabled = isCameraEnabled;
    });
  }, [isCameraEnabled]);

  // --------------------------------------------------
  // ICE SERVERS
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
              username:
                import.meta.env.VITE_TURN_USERNAME,
              credential:
                import.meta.env.VITE_TURN_CREDENTIAL,
            },
          ]
        : []),
    ],
  };

  // --------------------------------------------------
  // REMOVE PEER
  // --------------------------------------------------

  const removePeer = useCallback(
    (socketId: string) => {
      const peer = peersRef.current[socketId];

      if (peer) {
        try {
          peer.ontrack = null;
          peer.onicecandidate = null;
          peer.onconnectionstatechange = null;
          peer.close();
        } catch {
          // Ignore cleanup errors
        }

        delete peersRef.current[socketId];
      }

      delete pendingIceCandidatesRef.current[
        socketId
      ];

      setRemoteStreams((prev) =>
        prev.filter(
          (item) => item.socketId !== socketId
        )
      );
    },
    []
  );

  // --------------------------------------------------
  // CREATE PEER CONNECTION
  // --------------------------------------------------

  const createPeerConnection = useCallback(
    (
      targetSocketId: string,
      targetUser: any,
      stream: MediaStream
    ) => {
      const existingPeer =
        peersRef.current[targetSocketId];

      if (
        existingPeer &&
        existingPeer.connectionState !== 'closed' &&
        existingPeer.connectionState !== 'failed'
      ) {
        return existingPeer;
      }

      if (existingPeer) {
        removePeer(targetSocketId);
      }

      const peer =
        new RTCPeerConnection(ICE_SERVERS);

      // Add local tracks
      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      // ------------------------------------------------
      // REMOTE TRACK
      // ------------------------------------------------

      peer.ontrack = (event) => {
        if (!mountedRef.current) return;

        const remoteStream =
          event.streams?.[0];

        if (!remoteStream) return;

        setRemoteStreams((prev) => {
          const existing = prev.find(
            (item) =>
              item.socketId === targetSocketId
          );

          if (existing) {
            return prev.map((item) =>
              item.socketId === targetSocketId
                ? {
                    ...item,
                    stream: remoteStream,
                    user: targetUser,
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

      // ------------------------------------------------
      // ICE CANDIDATE
      // ------------------------------------------------

      peer.onicecandidate = (event) => {
        if (!event.candidate) return;

        socket.emit('ice-candidate', {
          target: targetSocketId,
          candidate: event.candidate,
          caller: socket.id,
        });
      };

      // ------------------------------------------------
      // CONNECTION STATE
      // ------------------------------------------------

      peer.onconnectionstatechange = () => {
        const state = peer.connectionState;

        if (state === 'connected') {
          console.log(
            'WebRTC connected:',
            targetSocketId
          );
        }

        if (state === 'failed') {
          console.log(
            'WebRTC connection failed:',
            targetSocketId
          );

          removePeer(targetSocketId);
        }

        if (state === 'closed') {
          removePeer(targetSocketId);
        }

        // Do NOT immediately destroy the peer on
        // "disconnected". Mobile networks can
        // temporarily report disconnected.
      };

      peer.oniceconnectionstatechange = () => {
        const state =
          peer.iceConnectionState;

        if (state === 'failed') {
          console.log(
            'ICE connection failed:',
            targetSocketId
          );

          removePeer(targetSocketId);
        }
      };

      peersRef.current[targetSocketId] = peer;

      return peer;
    },
    [removePeer]
  );

  // --------------------------------------------------
  // ADD QUEUED ICE CANDIDATES
  // --------------------------------------------------

  const flushIceCandidates = useCallback(
    async (socketId: string) => {
      const peer = peersRef.current[socketId];

      if (!peer) return;

      const queued =
        pendingIceCandidatesRef.current[
          socketId
        ];

      if (!queued?.length) return;

      pendingIceCandidatesRef.current[
        socketId
      ] = [];

      for (const candidate of queued) {
        try {
          await peer.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error(
            'Error adding queued ICE candidate:',
            error
          );
        }
      }
    },
    []
  );

  // --------------------------------------------------
  // JOIN ROOM
  // --------------------------------------------------

  const joinRoom = useCallback(() => {
    const currentUser = userRef.current;

    if (!currentUser?._id) {
      console.error(
        'Cannot join meeting: user is not available'
      );
      return;
    }
     if (joinedRoomRef.current) {
    return;
  }

    if (!socket.connected) {
      return;
    }

    socket.emit(
      'join-room',
      roomId,
      currentUser
    );

    joinedRoomRef.current = true;

    console.log(
      'Joined Nexivora room:',
      roomId
    );
  }, [roomId]);

  // --------------------------------------------------
  // INITIALIZE CAMERA + SOCKET
  // --------------------------------------------------

  const initialize = useCallback(async () => {
    const currentUser = userRef.current;

    if (!currentUser?._id) {
      console.log(
        'Waiting for authenticated user...'
      );
      return;
    }

    try {
      let stream =
        localStreamRef.current;

      // Get camera/microphone only once
      if (!stream) {
        stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: true,
              audio: true,
            }
          );

        stream
          .getVideoTracks()
          .forEach((track) => {
            track.enabled =
              cameraEnabledRef.current;
          });

        stream
          .getAudioTracks()
          .forEach((track) => {
            track.enabled =
              micEnabledRef.current;
          });

        localStreamRef.current = stream;

        if (mountedRef.current) {
          setLocalStream(stream);
        }
      }

      // Socket connection
      if (socket.connected) {
        joinRoom();
      } else {
        socket.connect();
      }
    } catch (error) {
      console.error(
        'Error accessing camera/microphone:',
        error
      );

      // Even without media permission,
      // still join the room.
      if (socket.connected) {
        joinRoom();
      } else {
        socket.connect();
      }
    }
  }, [joinRoom]);

  // --------------------------------------------------
  // MAIN WEBRTC EFFECT
  // --------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    // ------------------------------------------------
    // EXISTING PARTICIPANTS
    // ------------------------------------------------

    const handleRoomParticipants = async (
      existingParticipants: any[]
    ) => {
      if (!mountedRef.current) return;

      const filteredParticipants =
        existingParticipants.filter(
          (participant) =>
            participant.socketId &&
            participant.socketId !== socket.id
        );

      setParticipants(filteredParticipants);

      const stream =
        localStreamRef.current;

      if (!stream) {
        console.warn(
          'Local stream not ready when room participants arrived'
        );
        return;
      }

      for (const participant of filteredParticipants) {
        if (!mountedRef.current) return;

        try {
          let peer =
            peersRef.current[
              participant.socketId
            ];

          // Recreate broken peer
          if (
            !peer ||
            peer.connectionState === 'failed' ||
            peer.connectionState === 'closed'
          ) {
            peer = createPeerConnection(
              participant.socketId,
              participant.user,
              stream
            );
          }

          // Only the newly joined client creates
          // the initial offer.
          if (
            peer.signalingState !== 'stable'
          ) {
            continue;
          }

          const offer =
            await peer.createOffer();

          if (!mountedRef.current) return;

          await peer.setLocalDescription(
            offer
          );

          socket.emit('offer', {
            target:
              participant.socketId,
            caller: socket.id,
            sdp: offer,
            user: userRef.current,
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
    // NEW USER CONNECTED
    // ------------------------------------------------

    const handleUserConnected = ({
      socketId,
      user: newUser,
    }: any) => {
      if (!mountedRef.current) return;

      if (!socketId || socketId === socket.id) {
        return;
      }

      setParticipants((prev) => {
        const exists = prev.some(
          (participant) =>
            participant.socketId === socketId
        );

        if (exists) {
          return prev.map((participant) =>
            participant.socketId === socketId
              ? {
                  ...participant,
                  user: newUser,
                }
              : participant
          );
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
    // RECEIVE OFFER
    // ------------------------------------------------

    const handleOffer = async ({
      caller,
      sdp,
      user: callerUser,
    }: any) => {
      if (!mountedRef.current) return;

      if (!caller || caller === socket.id) {
        return;
      }

      const stream =
        localStreamRef.current;

      if (!stream) {
        console.warn(
          'Cannot handle offer: local stream unavailable'
        );
        return;
      }

      try {
        let peer =
          peersRef.current[caller];

        // If old connection is broken,
        // create a fresh one.
        if (
          !peer ||
          peer.connectionState === 'failed' ||
          peer.connectionState === 'closed'
        ) {
          peer = createPeerConnection(
            caller,
            callerUser,
            stream
          );
        }

        // If this peer is already processing
        // another offer, ignore stale offer.
        if (
          peer.signalingState !== 'stable'
        ) {
          return;
        }

        await peer.setRemoteDescription(
          new RTCSessionDescription(sdp)
        );

        await flushIceCandidates(caller);

        const answer =
          await peer.createAnswer();

        await peer.setLocalDescription(
          answer
        );

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

        // Remove broken peer so the next
        // connection attempt can recreate it.
        removePeer(caller);
      }
    };

    // ------------------------------------------------
    // RECEIVE ANSWER
    // ------------------------------------------------

    const handleAnswer = async ({
      caller,
      sdp,
    }: any) => {
      if (!caller || !sdp) return;

      const peer =
        peersRef.current[caller];

      if (!peer) return;

      try {
        if (
          peer.signalingState !==
          'have-local-offer'
        ) {
          return;
        }

        await peer.setRemoteDescription(
          new RTCSessionDescription(sdp)
        );

        await flushIceCandidates(caller);
      } catch (error) {
        console.error(
          'Error handling answer:',
          error
        );

        removePeer(caller);
      }
    };

    // ------------------------------------------------
    // ICE CANDIDATE
    // ------------------------------------------------

    const handleIceCandidate = async ({
      caller,
      candidate,
    }: any) => {
      if (!caller || !candidate) {
        return;
      }

      const peer =
        peersRef.current[caller];

      // Peer may not exist yet.
      // Queue candidate until offer/answer
      // creates the peer.
      if (!peer) {
        if (
          !pendingIceCandidatesRef.current[
            caller
          ]
        ) {
          pendingIceCandidatesRef.current[
            caller
          ] = [];
        }

        pendingIceCandidatesRef.current[
          caller
        ].push(candidate);

        return;
      }

      try {
        // Remote description must exist first.
        if (!peer.remoteDescription) {
          if (
            !pendingIceCandidatesRef.current[
              caller
            ]
          ) {
            pendingIceCandidatesRef.current[
              caller
            ] = [];
          }

          pendingIceCandidatesRef.current[
            caller
          ].push(candidate);

          return;
        }

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
    // USER DISCONNECTED
    // ------------------------------------------------

    const handleUserDisconnected = (
      socketId: string
    ) => {
      if (!socketId) return;

      removePeer(socketId);

      setParticipants((prev) =>
        prev.filter(
          (participant) =>
            participant.socketId !== socketId
        )
      );
    };

    // ------------------------------------------------
    // SOCKET CONNECT
    // ------------------------------------------------

    const handleSocketConnect = () => {
      if (!mountedRef.current) return;

      console.log(
        'Socket connected:',
        socket.id
      );

      // Every fresh socket connection gets
      // a fresh room join.
      joinedRoomRef.current = false;

      joinRoom();
    };

    // ------------------------------------------------
    // SOCKET DISCONNECT
    // ------------------------------------------------

    const handleSocketDisconnect = () => {
      joinedRoomRef.current = false;

      console.log(
        'Socket disconnected'
      );
    };

    // ------------------------------------------------
    // REGISTER EVENTS FIRST
    // ------------------------------------------------

    socket.on(
      'room-participants',
      handleRoomParticipants
    );

    socket.on(
      'user-connected',
      handleUserConnected
    );

    socket.on(
      'offer',
      handleOffer
    );

    socket.on(
      'answer',
      handleAnswer
    );

    socket.on(
      'ice-candidate',
      handleIceCandidate
    );

    socket.on(
      'user-disconnected',
      handleUserDisconnected
    );

    socket.on(
      'connect',
      handleSocketConnect
    );

    socket.on(
      'disconnect',
      handleSocketDisconnect
    );

    // ------------------------------------------------
    // START
    // ------------------------------------------------

    initialize();

    // ------------------------------------------------
    // CLEANUP
    // ------------------------------------------------

    return () => {
      mountedRef.current = false;

      socket.off(
        'room-participants',
        handleRoomParticipants
      );

      socket.off(
        'user-connected',
        handleUserConnected
      );

      socket.off(
        'offer',
        handleOffer
      );

      socket.off(
        'answer',
        handleAnswer
      );

      socket.off(
        'ice-candidate',
        handleIceCandidate
      );

      socket.off(
        'user-disconnected',
        handleUserDisconnected
      );

      socket.off(
        'connect',
        handleSocketConnect
      );

      socket.off(
        'disconnect',
        handleSocketDisconnect
      );

      // Close all peers
      Object.values(
        peersRef.current
      ).forEach((peer) => {
        try {
          peer.close();
        } catch {
          // Ignore cleanup errors
        }
      });

      peersRef.current = {};

      pendingIceCandidatesRef.current =
        {};

      joinedRoomRef.current = false;

      // Stop local media
      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        localStreamRef.current = null;
      }

      setLocalStream(null);
      setRemoteStreams([]);
      setParticipants([]);

      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [
    roomId,
    initialize,
    createPeerConnection,
    flushIceCandidates,
    removePeer,
    joinRoom,
  ]);

   // --------------------------------------------------
  // RETRY INITIALIZATION AFTER AUTH USER LOADS
  // --------------------------------------------------

  useEffect(() => {
    if (!user?._id) return;
    if (!mountedRef.current) return;

    initialize();
  }, [user?._id, initialize]);


  return {
    localStream,
    remoteStreams,
    participants,
  };
}