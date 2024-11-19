export class WebRTCConnection {
  private peerConnection: RTCPeerConnection;
  private stream: MediaStream | null = null;

  constructor(configuration: RTCConfiguration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  }) {
    this.peerConnection = new RTCPeerConnection(configuration);
  }

  hasRemoteDescription(): boolean {
    return this.peerConnection.remoteDescription !== null;
  }

  hasLocalDescription(): boolean {
    return this.peerConnection.localDescription !== null;
  }

  async setLocalStream(stream: MediaStream) {
    this.stream = stream;
    stream.getTracks().forEach(track => {
      if (this.stream) {
        this.peerConnection.addTrack(track, this.stream);
      }
    });
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
  }

  async setLocalDescription(description: RTCSessionDescriptionInit) {
    await this.peerConnection.setLocalDescription(new RTCSessionDescription(description));
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (this.peerConnection.signalingState !== "stable") {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }
  }

  async handleCandidate(candidate: RTCIceCandidateInit) {
    if (this.hasRemoteDescription()) {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      throw new Error('Cannot add ICE candidate without remote description');
    }
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate | null) => void) {
    this.peerConnection.onicecandidate = (event) => {
      callback(event.candidate);
    };
  }

  onTrack(callback: (stream: MediaStream) => void) {
    this.peerConnection.ontrack = (event) => {
      callback(event.streams[0]);
    };
  }

  close() {
    this.peerConnection.close();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }
} 