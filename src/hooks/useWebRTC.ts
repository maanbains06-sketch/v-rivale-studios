import { useRef, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

interface PeerState {
  pc: RTCPeerConnection;
  audioEl: HTMLAudioElement;
  makingOffer: boolean;
  ignoreOffer: boolean;
}

export function useWebRTC(roomId: string, userId: string, username: string) {
  const peers = useRef<Map<string, PeerState>>(new Map());
  const localAudioStream = useRef<MediaStream | null>(null);
  const localScreenStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<any>(null);
  const userIdRef = useRef(userId);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isScreenOn, setIsScreenOn] = useState(false);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
  const [remoteScreenUser, setRemoteScreenUser] = useState<string | null>(null);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [micPermission, setMicPermission] = useState<PermissionState | "unknown">("unknown");
  const [lastError, setLastError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // Check mic permission on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then((result) => {
        setMicPermission(result.state);
        result.onchange = () => setMicPermission(result.state);
      }).catch(() => {});
    }
  }, []);

  // Resume AudioContext on user interaction to handle autoplay policy
  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => {});
    }
  }, []);

  const createPeerConnection = useCallback((peerId: string) => {
    if (peers.current.has(peerId)) return peers.current.get(peerId)!.pc;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Always add transceivers for audio (sendrecv) so both sides can send/receive
    pc.addTransceiver("audio", { direction: "sendrecv" });

    // Add local audio tracks if mic is on
    if (localAudioStream.current) {
      const existingSenders = pc.getSenders().filter(s => s.track?.kind === "audio");
      localAudioStream.current.getAudioTracks().forEach(track => {
        // Replace the transceiver's track instead of adding new
        const emptyAudioSender = pc.getSenders().find(s => !s.track && s.track?.kind !== "video");
        if (emptyAudioSender) {
          emptyAudioSender.replaceTrack(track).catch(() => {});
        } else if (!existingSenders.some(s => s.track?.id === track.id)) {
          pc.addTrack(track, localAudioStream.current!);
        }
      });
    }

    // Add screen share tracks if sharing
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localScreenStreamRef.current!);
      });
    }

    // Handle remote tracks - use separate audio element per peer
    const audioEl = new Audio();
    audioEl.autoplay = true;
    audioEl.volume = 1.0;
    // Needed for some mobile browsers
    audioEl.setAttribute('playsinline', '');

    pc.ontrack = (event) => {
      ensureAudioContext();
      
      const track = event.track;
      const stream = event.streams[0];
      
      if (track.kind === "video") {
        // Screen share stream - use the stream containing video
        const screenStream = stream || new MediaStream([track]);
        setRemoteScreenStream(screenStream);
        setRemoteScreenUser(peerId);
      } else if (track.kind === "audio") {
        // Audio track - attach to the peer's audio element
        // Create a new stream with just this audio track to avoid conflicts
        const audioStream = stream || new MediaStream([track]);
        audioEl.srcObject = audioStream;
        
        // Force play with retry
        const playAudio = () => {
          audioEl.play().then(() => {
            console.log(`[WebRTC] Audio playing for peer ${peerId}`);
          }).catch((err) => {
            console.warn(`[WebRTC] Audio play failed for ${peerId}, retrying...`, err);
            // Retry after a short delay
            setTimeout(() => {
              audioEl.play().catch(() => {});
            }, 500);
          });
        };
        playAudio();

        // Also handle track unmute (track might start muted)
        track.onunmute = () => {
          playAudio();
        };
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: {
            from: userIdRef.current,
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
        // Try to restart ICE on failure
        if (pc.connectionState === "failed") {
          pc.restartIce();
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        pc.restartIce();
      }
    };

    // Handle negotiation needed - perfect negotiation pattern
    pc.onnegotiationneeded = async () => {
      const peerState = peers.current.get(peerId);
      if (!peerState) return;
      
      try {
        peerState.makingOffer = true;
        await pc.setLocalDescription();
        channelRef.current?.send({
          type: "broadcast",
          event: "offer",
          payload: { from: userIdRef.current, to: peerId, offer: pc.localDescription },
        });
      } catch (err) {
        console.error("[WebRTC] Negotiation error:", err);
      } finally {
        peerState.makingOffer = false;
      }
    };

    peers.current.set(peerId, { pc, audioEl, makingOffer: false, ignoreOffer: false });
    return pc;
  }, [ensureAudioContext]);

  // Perfect negotiation: handle offer
  const handleOffer = useCallback(async (from: string, offer: RTCSessionDescriptionInit) => {
    let peerState = peers.current.get(from);
    let pc: RTCPeerConnection;
    
    if (!peerState) {
      pc = createPeerConnection(from);
      peerState = peers.current.get(from)!;
    } else {
      pc = peerState.pc;
    }

    // Polite peer logic: we are polite if our userId < from (alphabetical)
    const polite = userIdRef.current < from;
    const offerCollision = peerState.makingOffer || pc.signalingState !== "stable";
    
    peerState.ignoreOffer = !polite && offerCollision;
    if (peerState.ignoreOffer) return;

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await pc.setLocalDescription();
      
      channelRef.current?.send({
        type: "broadcast",
        event: "answer",
        payload: { from: userIdRef.current, to: from, answer: pc.localDescription },
      });
    } catch (err) {
      console.error("[WebRTC] Error handling offer:", err);
    }
  }, [createPeerConnection]);

  const handleAnswer = useCallback(async (from: string, answer: RTCSessionDescriptionInit) => {
    const peer = peers.current.get(from);
    if (!peer) return;
    
    try {
      if (peer.pc.signalingState === "have-local-offer") {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.error("[WebRTC] Error handling answer:", err);
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
    const pc = createPeerConnection(peerId);
    // onnegotiationneeded will fire and send offer automatically
  }, [createPeerConnection]);

  // Join the signaling channel
  const joinSignaling = useCallback(() => {
    const channel = supabase.channel(`cinema-webrtc-${roomId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "peer-join" }, ({ payload }) => {
        if (payload.userId !== userIdRef.current) {
          initiateConnection(payload.userId);
        }
      })
      .on("broadcast", { event: "peer-leave" }, ({ payload }) => {
        const peer = peers.current.get(payload.userId);
        if (peer) {
          peer.pc.close();
          peer.audioEl?.pause();
          if (peer.audioEl) peer.audioEl.srcObject = null;
          peers.current.delete(payload.userId);
          setConnectedPeers(prev => prev.filter(p => p !== payload.userId));
          if (remoteScreenUser === payload.userId) {
            setRemoteScreenStream(null);
            setRemoteScreenUser(null);
          }
        }
      })
      .on("broadcast", { event: "offer" }, ({ payload }) => {
        if (payload.to === userIdRef.current) {
          handleOffer(payload.from, payload.offer);
        }
      })
      .on("broadcast", { event: "answer" }, ({ payload }) => {
        if (payload.to === userIdRef.current) {
          handleAnswer(payload.from, payload.answer);
        }
      })
      .on("broadcast", { event: "ice-candidate" }, ({ payload }) => {
        if (payload.to === userIdRef.current) {
          handleIceCandidate(payload.from, payload.candidate);
        }
      })
      .on("broadcast", { event: "screen-stopped" }, ({ payload }) => {
        if (payload.userId !== userIdRef.current) {
          setRemoteScreenStream(null);
          setRemoteScreenUser(null);
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.send({
            type: "broadcast",
            event: "peer-join",
            payload: { userId: userIdRef.current, username },
          });
        }
      });

    channelRef.current = channel;
  }, [roomId, userId, username, initiateConnection, handleOffer, handleAnswer, handleIceCandidate, remoteScreenUser]);

  const leaveSignaling = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "peer-leave",
      payload: { userId: userIdRef.current },
    });

    // Close all peer connections
    peers.current.forEach((peer) => {
      peer.pc.close();
      peer.audioEl?.pause();
      if (peer.audioEl) peer.audioEl.srcObject = null;
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
    localScreenStreamRef.current?.getTracks().forEach(t => t.stop());
    localScreenStreamRef.current = null;
    setLocalScreenStream(null);
    setIsMicOn(false);
    setIsScreenOn(false);
    setRemoteScreenStream(null);
    setRemoteScreenUser(null);

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  }, []);

  const toggleMic = useCallback(async (): Promise<string | null> => {
    ensureAudioContext();
    
    if (!isMicOn) {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          const msg = "Your browser doesn't support microphone access. Please use Chrome, Edge, or Firefox.";
          setLastError(msg);
          return msg;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
        localAudioStream.current = stream;
        setMicPermission("granted");
        
        // Add audio tracks to all existing peers using replaceTrack for reliability
        const audioTrack = stream.getAudioTracks()[0];
        for (const [peerId, peer] of peers.current) {
          const audioSender = peer.pc.getSenders().find(s => 
            s.track?.kind === "audio" || (!s.track && peer.pc.getTransceivers().some(t => t.sender === s && t.mid !== null))
          );
          
          if (audioSender) {
            await audioSender.replaceTrack(audioTrack).catch(() => {
              // Fallback: add track directly
              peer.pc.addTrack(audioTrack, stream);
            });
          } else {
            peer.pc.addTrack(audioTrack, stream);
          }
        }

        setIsMicOn(true);
        setLastError(null);
        await supabase.from("cinema_room_members").update({ is_muted: false }).eq("room_id", roomId).eq("user_id", userIdRef.current);
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
      // Mute: replace track with null on all senders
      for (const [, peer] of peers.current) {
        const audioSender = peer.pc.getSenders().find(s => s.track?.kind === "audio");
        if (audioSender) {
          await audioSender.replaceTrack(null).catch(() => {});
        }
      }
      localAudioStream.current?.getTracks().forEach(t => t.stop());
      localAudioStream.current = null;
      setIsMicOn(false);
      await supabase.from("cinema_room_members").update({ is_muted: true }).eq("room_id", roomId).eq("user_id", userIdRef.current);
    }
  }, [isMicOn, roomId, ensureAudioContext]);

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
        localScreenStreamRef.current = stream;
        setLocalScreenStream(stream);

        // Add screen tracks to all existing peers
        for (const [peerId, peer] of peers.current) {
          stream.getTracks().forEach(track => {
            peer.pc.addTrack(track, stream);
          });
          // onnegotiationneeded will handle renegotiation automatically
        }

        setIsScreenOn(true);
        setLastError(null);
        await supabase.from("cinema_room_members").update({ is_sharing_screen: true }).eq("room_id", roomId).eq("user_id", userIdRef.current);

        // Handle when user stops sharing from browser UI
        stream.getVideoTracks()[0].onended = async () => {
          localScreenStreamRef.current = null;
          setLocalScreenStream(null);
          setIsScreenOn(false);
          await supabase.from("cinema_room_members").update({ is_sharing_screen: false }).eq("room_id", roomId).eq("user_id", userIdRef.current);
          channelRef.current?.send({
            type: "broadcast",
            event: "screen-stopped",
            payload: { userId: userIdRef.current },
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
      // Remove screen tracks from peers
      for (const [, peer] of peers.current) {
        const screenSenders = peer.pc.getSenders().filter(s => 
          s.track && localScreenStreamRef.current?.getTracks().includes(s.track)
        );
        screenSenders.forEach(sender => {
          peer.pc.removeTrack(sender);
        });
      }
      
      localScreenStreamRef.current?.getTracks().forEach(t => t.stop());
      localScreenStreamRef.current = null;
      setLocalScreenStream(null);
      setIsScreenOn(false);
      await supabase.from("cinema_room_members").update({ is_sharing_screen: false }).eq("room_id", roomId).eq("user_id", userIdRef.current);
      channelRef.current?.send({
        type: "broadcast",
        event: "screen-stopped",
        payload: { userId: userIdRef.current },
      });
      return null;
    }
  }, [isScreenOn, roomId]);

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
    localScreenStream,
    micPermission,
    lastError,
    clearError: () => setLastError(null),
  };
}
