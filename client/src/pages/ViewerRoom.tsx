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

interface Room {
  id: string;
  title: string;
  hostId: string;
  viewers: string[];
}

export default function ViewerRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const rtcConnectionRef = useRef<WebRTCConnection | null>(null);
  const socketRef = useRef<SocketConnection | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    const socketConnection = new SocketConnection(SOCKET_SERVER);
    socketRef.current = socketConnection;
    const rtcConnection = new WebRTCConnection();
    rtcConnectionRef.current = rtcConnection;

    console.log('Attempting to join room with ID:', roomId);

    let pendingCandidates: RTCIceCandidateInit[] = [];

    rtcConnection.onTrack((stream) => {
      console.log('Received stream from broadcaster:', stream);
      console.log('Stream tracks:', stream.getTracks().map(t => ({
        kind: t.kind,
        enabled: t.enabled,
        readyState: t.readyState,
        muted: t.muted
      })));
      
      if (videoRef.current) {
        console.log('Setting video srcObject');
        videoRef.current.srcObject = stream;
        
        // 确保视频元素正确配置
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        
        videoRef.current.play().then(() => {
          console.log('Video playback started successfully');
        }).catch(err => {
          console.error('Error playing video:', err);
        });
      } else {
        console.error('Video element reference not found');
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

    socketConnection.emit('joinRoom', { roomId });

    socketConnection.on('roomJoined', (joinedRoom: Room) => {
      console.log('Successfully joined room:', joinedRoom);
      setRoom(joinedRoom);
    });

    socketConnection.on('streamOffer', async (data: { offer: RTCSessionDescriptionInit; roomId: string }) => {
      console.log('Received offer from broadcaster:', data.offer);
      try {
        await rtcConnection.setRemoteDescription(data.offer);
        console.log('Set remote description successfully');
        
        while (pendingCandidates.length > 0) {
          const candidate = pendingCandidates.shift();
          if (candidate) {
            console.log('Processing pending ICE candidate');
            await rtcConnection.handleCandidate(candidate);
          }
        }

        const answer = await rtcConnection.createAnswer();
        console.log('Created answer:', answer);
        socketConnection.emit('streamAnswer', {
          roomId: data.roomId,
          answer
        });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    socketConnection.on('iceCandidate', async (candidate: RTCIceCandidateInit) => {
      console.log('Received ICE candidate:', candidate);
      try {
        if (rtcConnection.hasRemoteDescription()) {
          await rtcConnection.handleCandidate(candidate);
          console.log('Added ICE candidate successfully');
        } else {
          console.log('Queuing ICE candidate');
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

  useEffect(() => {
    if (!socketRef.current) return;

    const handleError = (error: any) => {
      console.error('Socket error:', error);
      alert(error.message || 'Failed to join room');
      navigate('/');
    };

    socketRef.current.on('error', handleError);

    // 确保在组件卸载时清理监听器
    return () => {
      if (socketRef.current) {
        socketRef.current.removeListener('error', handleError);
      }
    };
  }, [socketRef, navigate]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
            <Typography variant="h4" component="div" sx={{ flexGrow: 1 }}>
              {room?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              房间号：{roomId}
            </Typography>
          </Stack>
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