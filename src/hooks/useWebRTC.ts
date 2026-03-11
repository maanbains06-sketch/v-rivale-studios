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
  const [isDeafened, setIsDeafened] = useState(false);
  const [localScreenStream, setLocalScreenStream] = useState<MediaStream | null>(null);
  const [remoteScreenStream, setRemoteScreenStream] = useState<MediaStream | null>(null);
  const [remoteScreenUser, setRemoteScreenUser] = useState<string | null>(null);
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [micPermission, setMicPermission] = useState<PermissionState | "unknown">("unknown");
  const [lastError, setLastError] = useState<string | null>(null);
  const isDeafenedRef = useRef(false);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    isDeafenedRef.current = isDeafened;
  }, [isDeafened]);

  // Check mic permission on mount
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: "microphone" as PermissionName }).then((result) => {
        setMicPermission(result.state);
        result.onchange = () => setMicPermission(result.state);
      }).catch(() => {});
    }
  }, []);

  const createPeerConnection = useCallback((peerId: string) => {
    if (peers.current.has(peerId)) return peers.current.get(peerId)!.pc;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // Add audio transceiver - always sendrecv so both sides can talk
    const audioTransceiver = pc.addTransceiver("audio", { direction: "sendrecv" });

    // If we have a local audio track, set it on the transceiver sender
    if (localAudioStream.current) {
      const audioTrack = localAudioStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTransceiver.sender.replaceTrack(audioTrack).catch(console.error);
      }
    }

    // Add screen share tracks if currently sharing
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localScreenStreamRef.current!);
      });
    }

    // Audio element for this peer's audio
    const audioEl = new Audio();
    audioEl.autoplay = true;
    audioEl.volume = isDeafenedRef.current ? 0 : 1.0;
    audioEl.setAttribute('playsinline', '');

    pc.ontrack = (event) => {
      const track = event.track;
      const stream = event.streams[0] || new MediaStream([track]);

      if (track.kind === "video") {
        // Screen share from remote
        setRemoteScreenStream(stream);
        setRemoteScreenUser(peerId);
        
        track.onended = () => {
          setRemoteScreenStream(null);
          setRemoteScreenUser(null);
        };
      } else if (track.kind === "audio") {
        // Remote audio - attach to this peer's audio element
        audioEl.srcObject = stream;
        audioEl.volume = isDeafenedRef.current ? 0 : 1.0;

        const playAudio = () => {
          audioEl.play().catch(() => {
            setTimeout(() => audioEl.play().catch(() => {}), 500);
          });
        };
        playAudio();

        track.onunmute = () => playAudio();
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

    // Perfect negotiation: onnegotiationneeded
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
  }, []);

  // Handle offer (perfect negotiation - polite peer)
  const handleOffer = useCallback(async (from: string, offer: RTCSessionDescriptionInit) => {
    let peerState = peers.current.get(from);
    let pc: RTCPeerConnection;

    if (!peerState) {
      pc = createPeerConnection(from);
      peerState = peers.current.get(from)!;
    } else {
      pc = peerState.pc;
    }

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
    createPeerConnection(peerId);
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
          // Clear remote screen if this peer was sharing
          setRemoteScreenUser(prev => {
            if (prev === payload.userId) {
              setRemoteScreenStream(null);
              return null;
            }
            return prev;
          });
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
  }, [roomId, userId, username, initiateConnection, handleOffer, handleAnswer, handleIceCandidate]);

  const leaveSignaling = useCallback(() => {
    channelRef.current?.send({
      type: "broadcast",
      event: "peer-leave",
      payload: { userId: userIdRef.current },
    });

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

    localAudioStream.current?.getTracks().forEach(t => t.stop());
    localAudioStream.current = null;
    localScreenStreamRef.current?.getTracks().forEach(t => t.stop());
    localScreenStreamRef.current = null;
    setLocalScreenStream(null);
    setIsMicOn(false);
    setIsScreenOn(false);
    setIsDeafened(false);
    setRemoteScreenStream(null);
    setRemoteScreenUser(null);
  }, []);

  const toggleMic = useCallback(async (): Promise<string | null> => {
    if (!isMicOn) {
      // Turn mic ON
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

        const audioTrack = stream.getAudioTracks()[0];

        // Replace audio track on all peer connections using the audio transceiver
        for (const [, peer] of peers.current) {
          const audioTransceiver = peer.pc.getTransceivers().find(t => 
            t.mid !== null && t.receiver.track?.kind === "audio"
          );
          
          if (audioTransceiver) {
            await audioTransceiver.sender.replaceTrack(audioTrack).catch((err) => {
              console.warn("[WebRTC] replaceTrack failed, adding track:", err);
              try { peer.pc.addTrack(audioTrack, stream); } catch {}
            });
          } else {
            // No audio transceiver found, add one
            try { peer.pc.addTrack(audioTrack, stream); } catch {}
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
      // Turn mic OFF - replace track with null (keeps transceiver alive)
      for (const [, peer] of peers.current) {
        const audioTransceiver = peer.pc.getTransceivers().find(t =>
          t.sender.track?.kind === "audio"
        );
        if (audioTransceiver) {
          await audioTransceiver.sender.replaceTrack(null).catch(() => {});
        }
      }
      localAudioStream.current?.getTracks().forEach(t => t.stop());
      localAudioStream.current = null;
      setIsMicOn(false);
      await supabase.from("cinema_room_members").update({ is_muted: true }).eq("room_id", roomId).eq("user_id", userIdRef.current);
      return null;
    }
  }, [isMicOn, roomId]);

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
        for (const [, peer] of peers.current) {
          stream.getTracks().forEach(track => {
            peer.pc.addTrack(track, stream);
          });
        }

        setIsScreenOn(true);
        setLastError(null);
        await supabase.from("cinema_room_members").update({ is_sharing_screen: true }).eq("room_id", roomId).eq("user_id", userIdRef.current);

        // Handle browser "Stop sharing" button
        stream.getVideoTracks()[0].onended = async () => {
          // Remove screen tracks from all peers
          for (const [, peer] of peers.current) {
            const screenSenders = peer.pc.getSenders().filter(s =>
              s.track && stream.getTracks().some(t => t.id === s.track!.id)
            );
            screenSenders.forEach(sender => {
              try { peer.pc.removeTrack(sender); } catch {}
            });
          }
          
          stream.getTracks().forEach(t => t.stop());
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
      // Stop screen share
      for (const [, peer] of peers.current) {
        const screenSenders = peer.pc.getSenders().filter(s =>
          s.track && localScreenStreamRef.current?.getTracks().some(t => t.id === s.track!.id)
        );
        screenSenders.forEach(sender => {
          try { peer.pc.removeTrack(sender); } catch {}
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

  // Deafen: mute/unmute all remote audio
  const toggleDeafen = useCallback(() => {
    const newDeafened = !isDeafened;
    setIsDeafened(newDeafened);
    isDeafenedRef.current = newDeafened;

    // Set volume on all peer audio elements
    for (const [, peer] of peers.current) {
      peer.audioEl.volume = newDeafened ? 0 : 1.0;
    }
  }, [isDeafened]);

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
    toggleDeafen,
    isMicOn,
    isScreenOn,
    isDeafened,
    remoteScreenStream,
    remoteScreenUser,
    connectedPeers,
    localScreenStream,
    micPermission,
    lastError,
    clearError: () => setLastError(null),
  };
}
