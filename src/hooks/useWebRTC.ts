import { useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

interface PeerState {
  pc: RTCPeerConnection;
  audioEl?: HTMLAudioElement;
  videoEl?: HTMLVideoElement;
}

export function useWebRTC(roomId: string, userId: string, username: string) {
  const peers = useRef<Map<string, PeerState>>(new Map());
  const localAudioStream = useRef<MediaStream | null>(null);
  const localScreenStream = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenOn, setIsScreenOn] = useState(false);
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
  const [remoteScreenUser, setRemoteScreenUser] = useState<string | null>(null);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [micPermission, setMicPermission] = useState<PermissionState | "unknown">("unknown");
  const [lastError, setLastError] = useState<string | null>(null);

  // Check mic permission on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then((result) => {
        setMicPermission(result.state);
        result.onchange = () => setMicPermission(result.state);
      }).catch(() => {});
    }
  }, []);

  const createPeerConnection = useCallback((peerId: string, isInitiator: boolean) => {
    if (peers.current.has(peerId)) return peers.current.get(peerId)!.pc;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add local audio tracks if mic is on
    if (localAudioStream.current) {
      localAudioStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localAudioStream.current!);
      });
    }

    // Add screen share tracks if sharing
    if (localScreenStream.current) {
      localScreenStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localScreenStream.current!);
      });
    }

    // Handle remote tracks
    const audioEl = new Audio();
    audioEl.autoplay = true;

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (!stream) return;
      
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        // This is a screen share stream
        setRemoteScreenStream(stream);
        setRemoteScreenUser(peerId);
      } else {
        // Audio stream
        audioEl.srcObject = stream;
        audioEl.play().catch(() => {});
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: {
            from: userId,
            to: peerId,
            candidate: event.candidate.toJSON(),
          },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setConnectedPeers(prev => [...new Set([...prev, peerId])]);
      } else if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setConnectedPeers(prev => prev.filter(p => p !== peerId));
      }
    };

    peers.current.set(peerId, { pc, audioEl });

    return pc;
  }, [userId]);

  const handleOffer = useCallback(async (from: string, offer: RTCSessionDescriptionInit) => {
    const pc = createPeerConnection(from, false);
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    channelRef.current?.send({
      type: "broadcast",
      event: "answer",
      payload: { from: userId, to: from, answer },
    });
  }, [createPeerConnection, userId]);

  const handleAnswer = useCallback(async (from: string, answer: RTCSessionDescriptionInit) => {
    const peer = peers.current.get(from);
    if (peer) {
      await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }, []);

  const handleIceCandidate = useCallback(async (from: string, candidate: RTCIceCandidateInit) => {
    const peer = peers.current.get(from);
    if (peer) {
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {}
    }
  }, []);

  const initiateConnection = useCallback(async (peerId: string) => {
    const pc = createPeerConnection(peerId, true);
    
    // Add a transceiver to ensure we can receive audio even if not sending
    if (pc.getTransceivers().length === 0) {
      pc.addTransceiver("audio", { direction: "sendrecv" });
    }

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    channelRef.current?.send({
      type: "broadcast",
      event: "offer",
      payload: { from: userId, to: peerId, offer },
    });
  }, [createPeerConnection, userId]);

  // Join the signaling channel
  const joinSignaling = useCallback(() => {
    const channel = supabase.channel(`cinema-webrtc-${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "peer-join" }, ({ payload }) => {
        if (payload.userId !== userId) {
          // New peer joined, initiate connection
          initiateConnection(payload.userId);
        }
      })
      .on("broadcast", { event: "peer-leave" }, ({ payload }) => {
        const peer = peers.current.get(payload.userId);
        if (peer) {
          peer.pc.close();
          peer.audioEl?.pause();
          peers.current.delete(payload.userId);
          setConnectedPeers(prev => prev.filter(p => p !== payload.userId));
          if (remoteScreenUser === payload.userId) {
            setRemoteScreenStream(null);
            setRemoteScreenUser(null);
          }
        }
      })
      .on("broadcast", { event: "offer" }, ({ payload }) => {
        if (payload.to === userId) {
          handleOffer(payload.from, payload.offer);
        }
      })
      .on("broadcast", { event: "answer" }, ({ payload }) => {
        if (payload.to === userId) {
          handleAnswer(payload.from, payload.answer);
        }
      })
      .on("broadcast", { event: "ice-candidate" }, ({ payload }) => {
        if (payload.to === userId) {
          handleIceCandidate(payload.from, payload.candidate);
        }
      })
      .on("broadcast", { event: "screen-stopped" }, ({ payload }) => {
        if (payload.userId !== userId) {
          setRemoteScreenStream(null);
          setRemoteScreenUser(null);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Announce presence
          channel.send({
            type: "broadcast",
            event: "peer-join",
            payload: { userId, username },
          });
        }
      });

    channelRef.current = channel;
  }, [roomId, userId, username, initiateConnection, handleOffer, handleAnswer, handleIceCandidate, remoteScreenUser]);

  const leaveSignaling = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "peer-leave",
      payload: { userId },
    });

    // Close all peer connections
    peers.current.forEach((peer) => {
      peer.pc.close();
      peer.audioEl?.pause();
    });
    peers.current.clear();
    setConnectedPeers([]);

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Stop local streams
    localAudioStream.current?.getTracks().forEach(t => t.stop());
    localAudioStream.current = null;
    localScreenStream.current?.getTracks().forEach(t => t.stop());
    localScreenStream.current = null;
    setIsMicOn(false);
    setIsScreenOn(false);
    setRemoteScreenStream(null);
    setRemoteScreenUser(null);
  }, [userId]);

  const toggleMic = useCallback(async (): Promise<string | null> => {
    if (!isMicOn) {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const msg = "Your browser doesn't support microphone access. Please use Chrome, Edge, or Firefox.";
          setLastError(msg);
          return msg;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localAudioStream.current = stream;
        setMicPermission("granted");
        
        // Add audio tracks to all existing peers
        peers.current.forEach((peer) => {
          stream.getTracks().forEach(track => {
            peer.pc.addTrack(track, stream);
          });
        });

        // Renegotiate with all peers
        for (const [peerId, peer] of peers.current) {
          const offer = await peer.pc.createOffer();
          await peer.pc.setLocalDescription(offer);
          channelRef.current?.send({
            type: "broadcast",
            event: "offer",
            payload: { from: userId, to: peerId, offer },
          });
        }

        setIsMicOn(true);
        setLastError(null);
        await supabase.from("cinema_room_members").update({ is_muted: false }).eq("room_id", roomId).eq("user_id", userId);
        return null;
      } catch (err: any) {
        let msg = "Microphone access denied. ";
        if (err?.name === "NotAllowedError") {
          msg += "Click the 🔒 icon in your browser's address bar → Allow Microphone → Reload the page.";
        } else if (err?.name === "NotFoundError") {
          msg += "No microphone found. Please connect a microphone and try again.";
        } else {
          msg += "Please check your browser permissions.";
        }
        setMicPermission("denied");
        setLastError(msg);
        return msg;
      }
    } else {
      localAudioStream.current?.getTracks().forEach(t => t.stop());
      localAudioStream.current = null;
      setIsMicOn(false);
      await supabase.from("cinema_room_members").update({ is_muted: true }).eq("room_id", roomId).eq("user_id", userId);
    }
  }, [isMicOn, userId, roomId]);

  const toggleScreen = useCallback(async (): Promise<string | null> => {
    if (!isScreenOn) {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          const msg = "Your browser doesn't support screen sharing. Please use Chrome, Edge, or Firefox.";
          setLastError(msg);
          return msg;
        }
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { cursor: "always" } as any, 
          audio: true 
        });
        localScreenStream.current = stream;

        // Add screen tracks to all existing peers
        peers.current.forEach((peer) => {
          stream.getTracks().forEach(track => {
            peer.pc.addTrack(track, stream);
          });
        });

        // Renegotiate
        for (const [peerId, peer] of peers.current) {
          const offer = await peer.pc.createOffer();
          await peer.pc.setLocalDescription(offer);
          channelRef.current?.send({
            type: "broadcast",
            event: "offer",
            payload: { from: userId, to: peerId, offer },
          });
        }

        setIsScreenOn(true);
        setLastError(null);
        await supabase.from("cinema_room_members").update({ is_sharing_screen: true }).eq("room_id", roomId).eq("user_id", userId);

        // Handle when user stops sharing from browser UI
        stream.getVideoTracks()[0].onended = async () => {
          localScreenStream.current = null;
          setIsScreenOn(false);
          await supabase.from("cinema_room_members").update({ is_sharing_screen: false }).eq("room_id", roomId).eq("user_id", userId);
          channelRef.current?.send({
            type: "broadcast",
            event: "screen-stopped",
            payload: { userId },
          });
        };
        return null;
      } catch (err: any) {
        let msg = "Screen sharing denied. ";
        if (err?.name === "NotAllowedError") {
          msg += "You cancelled the screen share dialog or permission was denied.";
        } else {
          msg += "Please try again.";
        }
        setLastError(msg);
        return msg;
      }
    } else {
      localScreenStream.current?.getTracks().forEach(t => t.stop());
      localScreenStream.current = null;
      setIsScreenOn(false);
      await supabase.from("cinema_room_members").update({ is_sharing_screen: false }).eq("room_id", roomId).eq("user_id", userId);
      channelRef.current?.send({
        type: "broadcast",
        event: "screen-stopped",
        payload: { userId },
      });
      return null;
    }
  }, [isScreenOn, userId, roomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveSignaling();
    };
  }, []);

  return {
    joinSignaling,
    leaveSignaling,
    toggleMic,
    toggleScreen,
    isMicOn,
    isScreenOn,
    remoteScreenStream,
    remoteScreenUser,
    connectedPeers,
    localScreenStream: localScreenStream.current,
  };
}
