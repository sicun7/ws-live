import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
} from '@mui/material';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import VideocamIcon from '@mui/icons-material/Videocam';
import { WebRTCConnection } from '../utils/webrtc';
import { SocketConnection } from '../utils/socket';

const SOCKET_SERVER = 'http://192.168.6.9:8081';

export default function BroadcastRoom() {
  const { roomId } = useParams();
  const [socket, setSocket] = useState<SocketConnection | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rtcConnectionsRef = useRef<Map<string, WebRTCConnection>>(new Map());

  useEffect(() => {
    const socketConnection = new SocketConnection(SOCKET_SERVER);
    setSocket(socketConnection);

    socketConnection.emit('createRoom', roomId);

    socketConnection.on('viewerJoined', async (data: { viewerId: string; roomId: string }) => {
      console.log('New viewer joined:', data.viewerId);
      const rtcConnection = new WebRTCConnection();
      
      if (streamRef.current) {
        await rtcConnection.setLocalStream(streamRef.current);
      }

      rtcConnection.onIceCandidate((candidate) => {
        if (candidate) {
          socketConnection.emit('iceCandidate', {
            roomId: data.roomId,
            viewerId: data.viewerId,
            candidate
          });
        }
      });

      const offer = await rtcConnection.createOffer();
      socketConnection.emit('streamOffer', {
        roomId: data.roomId,
        viewerId: data.viewerId,
        offer
      });

      rtcConnectionsRef.current.set(data.viewerId, rtcConnection);
    });

    socketConnection.on('streamAnswer', async (data: { answer: RTCSessionDescriptionInit; viewerId: string }) => {
      const rtcConnection = rtcConnectionsRef.current.get(data.viewerId);
      if (rtcConnection) {
        await rtcConnection.handleAnswer(data.answer);
      }
    });

    socketConnection.on('iceCandidate', async (data: { candidate: RTCIceCandidateInit; viewerId: string }) => {
      const rtcConnection = rtcConnectionsRef.current.get(data.viewerId);
      if (rtcConnection) {
        await rtcConnection.handleCandidate(data.candidate);
      }
    });

    return () => {
      rtcConnectionsRef.current.forEach(connection => connection.close());
      socketConnection.close();
    };
  }, [roomId]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsScreenSharing(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsScreenSharing(true);
    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom align="center">
            直播间: {roomId}
          </Typography>
          <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
                objectFit: 'contain'
              }}
            />
          </Box>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<VideocamIcon />}
              onClick={startCamera}
              fullWidth
            >
              开启摄像头
            </Button>
            <Button
              variant="contained"
              startIcon={<ScreenShareIcon />}
              onClick={startScreenShare}
              fullWidth
            >
              共享屏幕
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
} 