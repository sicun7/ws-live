import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Stack,
  Paper,
} from '@mui/material';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
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

export default function BroadcastRoom() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [socket, setSocket] = useState<SocketConnection | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rtcConnectionsRef = useRef<Map<string, WebRTCConnection>>(new Map());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socketConnection = new SocketConnection(SOCKET_SERVER);
    setSocket(socketConnection);

    const roomTitle = localStorage.getItem(`room-title-${roomId}`) || '未命名直播间';
    
    socketConnection.emit('createRoom', { roomId, title: roomTitle });

    socketConnection.on('roomCreated', (createdRoom: Room) => {
      setRoom(createdRoom);
    });

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

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsStreaming(false);
      setIsScreenSharing(false);
    }
  };

  const startCamera = async () => {
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsStreaming(true);
      setIsScreenSharing(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
    }
  };

  const startScreenShare = async () => {
    try {
      stopStream();
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
      setIsStreaming(true);
      setIsScreenSharing(true);
    } catch (err) {
      console.error('Error sharing screen:', err);
    }
  };

  const endBroadcast = () => {
    stopStream();
    rtcConnectionsRef.current.forEach(connection => connection.close());
    if (socket) {
      socket.emit('endBroadcast', roomId);
      socket.close();
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
              muted
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
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              startIcon={isStreaming && !isScreenSharing ? <VideocamOffIcon /> : <VideocamIcon />}
              onClick={isStreaming && !isScreenSharing ? stopStream : startCamera}
              fullWidth
            >
              {isStreaming && !isScreenSharing ? '关闭摄像头' : '开启摄像头'}
            </Button>
            <Button
              variant="contained"
              startIcon={isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              onClick={isScreenSharing ? stopStream : startScreenShare}
              fullWidth
            >
              {isScreenSharing ? '停止共享' : '共享屏幕'}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={endBroadcast}
              fullWidth
            >
              结束直播
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
} 