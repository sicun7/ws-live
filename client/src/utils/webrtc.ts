export class WebRTCConnection {
  private peerConnection: RTCPeerConnection;
  private stream: MediaStream | null = null;

  constructor() {
    const configuration: RTCConfiguration = {
      iceServers: [
        { 
          urls: [
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
            'stun:stun3.l.google.com:19302',
            'stun:stun4.l.google.com:19302'
          ]
        }
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    };

    this.peerConnection = new RTCPeerConnection(configuration);
    
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', this.peerConnection.iceConnectionState);
    };

    this.peerConnection.onicegatheringstatechange = () => {
      console.log('ICE gathering state:', this.peerConnection.iceGatheringState);
    };

    this.peerConnection.onsignalingstatechange = () => {
      console.log('Signaling state:', this.peerConnection.signalingState);
    };
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
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error('Error setting remote description:', err);
      throw err;
    }
  }

  async handleCandidate(candidate: RTCIceCandidateInit) {
    try {
      if (this.hasRemoteDescription()) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        throw new Error('Cannot add ICE candidate without remote description');
      }
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
      throw err;
    }
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate | null) => void) {
    this.peerConnection.onicecandidate = (event) => {
      callback(event.candidate);
    };
  }

  onTrack(callback: (stream: MediaStream) => void) {
    this.peerConnection.ontrack = (event) => {
      console.log('Received track:', event.track.kind, event.track.readyState);
      callback(event.streams[0]);
    };
  }

  close() {
    this.peerConnection.close();
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
  }

  addTrack(track: MediaStreamTrack, stream: MediaStream) {
    try {
      this.peerConnection.addTrack(track, stream);
    } catch (err) {
      console.error('Error adding track:', err);
      throw err;
    }
  }
} 