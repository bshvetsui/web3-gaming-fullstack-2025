import SimplePeer from 'simple-peer';

/**
 * WebRTC manager for peer-to-peer voice chat
 * Uses SimplePeer for easier WebRTC connection management
 */
export class WebRTCManager {
  private peers: Map<string, SimplePeer.Instance> = new Map();
  private localStream: MediaStream | null = null;
  private onRemoteStream?: (peerId: string, stream: MediaStream) => void;

  /**
   * Initialize local audio stream
   */
  async initializeLocalStream(): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      return this.localStream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw error;
    }
  }

  /**
   * Create a peer connection (initiator)
   */
  createPeer(peerId: string, onSignal: (signal: any) => void): SimplePeer.Instance {
    if (!this.localStream) {
      throw new Error('Local stream not initialized');
    }

    const peer = new SimplePeer({
      initiator: true,
      stream: this.localStream,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    this.setupPeerHandlers(peer, peerId, onSignal);
    this.peers.set(peerId, peer);

    return peer;
  }

  /**
   * Answer a peer connection
   */
  answerPeer(
    peerId: string,
    signal: SimplePeer.SignalData,
    onSignal: (signal: any) => void
  ): SimplePeer.Instance {
    if (!this.localStream) {
      throw new Error('Local stream not initialized');
    }

    const peer = new SimplePeer({
      initiator: false,
      stream: this.localStream,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    this.setupPeerHandlers(peer, peerId, onSignal);

    peer.signal(signal);
    this.peers.set(peerId, peer);

    return peer;
  }

  /**
   * Setup event handlers for peer connection
   */
  private setupPeerHandlers(
    peer: SimplePeer.Instance,
    peerId: string,
    onSignal: (signal: any) => void
  ) {
    peer.on('signal', (signal) => {
      onSignal(signal);
    });

    peer.on('stream', (stream) => {
      console.log('Received remote stream from peer:', peerId);

      if (this.onRemoteStream) {
        this.onRemoteStream(peerId, stream);
      }
    });

    peer.on('error', (error) => {
      console.error('Peer error:', error);
    });

    peer.on('close', () => {
      console.log('Peer connection closed:', peerId);
      this.peers.delete(peerId);
    });
  }

  /**
   * Signal a peer
   */
  signalPeer(peerId: string, signal: SimplePeer.SignalData) {
    const peer = this.peers.get(peerId);

    if (peer) {
      peer.signal(signal);
    }
  }

  /**
   * Remove a peer connection
   */
  removePeer(peerId: string) {
    const peer = this.peers.get(peerId);

    if (peer) {
      peer.destroy();
      this.peers.delete(peerId);
    }
  }

  /**
   * Mute/unmute local audio
   */
  setMuted(muted: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  /**
   * Set callback for when remote stream is received
   */
  onRemoteStreamReceived(callback: (peerId: string, stream: MediaStream) => void) {
    this.onRemoteStream = callback;
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Cleanup all connections
   */
  cleanup() {
    // Destroy all peer connections
    this.peers.forEach((peer) => peer.destroy());
    this.peers.clear();

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }
}

export const webrtcManager = new WebRTCManager();
