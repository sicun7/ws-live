import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import { WebRTCConnection } from '../utils/webrtc';
import { SocketConnection } from '../utils/socket';

const SOCKET_SERVER = 'http://192.168.6.9:8081';

export default function ViewerRoom() {
  const { roomId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const rtcConnectionRef = useRef<WebRTCConnection | null>(null);

  useEffect(() => {
    const socketConnection = new SocketConnection(SOCKET_SERVER);
    const rtcConnection = new WebRTCConnection();
    rtcConnectionRef.current = rtcConnection;

    let pendingCandidates: RTCIceCandidateInit[] = [];

    rtcConnection.onTrack((stream) => {
      console.log('Received stream from broadcaster');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });

    rtcConnection.onIceCandidate((candidate) => {
      if (candidate) {
        socketConnection.emit('iceCandidate', {
          roomId,
          viewerId: undefined,
          candidate
        });
      }
    });

    socketConnection.emit('joinRoom', roomId);

    socketConnection.on('streamOffer', async (data: { offer: RTCSessionDescriptionInit; roomId: string }) => {
      console.log('Received offer from broadcaster');
      try {
        await rtcConnection.setRemoteDescription(data.offer);
        
        while (pendingCandidates.length > 0) {
          const candidate = pendingCandidates.shift();
          if (candidate) {
            await rtcConnection.handleCandidate(candidate);
          }
        }

        const answer = await rtcConnection.createAnswer();
        socketConnection.emit('streamAnswer', {
          roomId: data.roomId,
          answer
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    socketConnection.on('iceCandidate', async (candidate: RTCIceCandidateInit) => {
      try {
        if (rtcConnection.hasRemoteDescription()) {
          await rtcConnection.handleCandidate(candidate);
        } else {
          pendingCandidates.push(candidate);
        }
      } catch (err) {
        console.error('Error handling ICE candidate:', err);
      }
    });

    return () => {
      rtcConnection.close();
      socketConnection.close();
    };
  }, [roomId]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom align="center">
            观看直播: {roomId}
          </Typography>
          <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
                objectFit: 'contain'
              }}
            />
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 