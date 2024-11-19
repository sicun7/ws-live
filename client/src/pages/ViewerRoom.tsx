import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Stack,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { WebRTCConnection } from '../utils/webrtc';
import { SocketConnection } from '../utils/socket';

const SOCKET_SERVER = 'http://192.168.6.9:8081';

export default function ViewerRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const rtcConnectionRef = useRef<WebRTCConnection | null>(null);
  const socketRef = useRef<SocketConnection | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socketConnection = new SocketConnection(SOCKET_SERVER);
    socketRef.current = socketConnection;
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

  const leaveRoom = () => {
    if (rtcConnectionRef.current) {
      rtcConnectionRef.current.close();
    }
    if (socketRef.current) {
      socketRef.current.emit('leaveRoom', roomId);
      socketRef.current.close();
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    navigate('/');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom align="center">
            观看直播: {roomId}
          </Typography>
          <Box 
            ref={containerRef}
            sx={{ 
              position: 'relative', 
              width: '100%', 
              aspectRatio: '16/9',
              bgcolor: '#000'
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
            <Button
              variant="contained"
              color="primary"
              sx={{
                position: 'absolute',
                right: 16,
                bottom: 16,
                minWidth: 'auto',
                width: 40,
                height: 40,
                borderRadius: '50%',
                padding: 0
              }}
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </Button>
          </Box>
          <Stack direction="row" justifyContent="center" sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={leaveRoom}
            >
              离开直播间
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
} 