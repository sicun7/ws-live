import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
} from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import PeopleIcon from '@mui/icons-material/People';
import { SocketConnection } from '../utils/socket';

const SOCKET_SERVER = 'http://192.168.6.9:8081';

interface Room {
  id: string;
  title: string;
  hostId: string;
  viewers: string[];
}

export default function Home() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [socket, setSocket] = useState<SocketConnection | null>(null);

  useEffect(() => {
    const socketConnection = new SocketConnection(SOCKET_SERVER);
    setSocket(socketConnection);

    // 获取初始房间列表
    socketConnection.emit('getRooms');

    // 监听房间列表更新
    socketConnection.on('rooms', (updatedRooms: Room[]) => {
      console.log('Received rooms:', updatedRooms);
      setRooms(updatedRooms);
    });

    // 每30秒自动刷新一次房间列表
    const refreshInterval = setInterval(() => {
      socketConnection.emit('getRooms');
    }, 30000);

    return () => {
      clearInterval(refreshInterval);
      socketConnection.close();
    };
  }, []);

  const handleCreateRoom = () => {
    if (newRoomTitle.trim()) {
      const newRoomId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem(`room-title-${newRoomId}`, newRoomTitle);
      
      socket?.emit('createRoom', { roomId: newRoomId, title: newRoomTitle });
      setIsCreateDialogOpen(false);
      setNewRoomTitle('');
      navigate(`/broadcast/${newRoomId}`);
    }
  };

  const handleJoinRoom = (roomId: string) => {
    if (roomId.trim()) {
      navigate(`/view/${roomId}`);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          直播平台
        </Typography>
        <Stack spacing={3} alignItems="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<VideocamIcon />}
            onClick={() => setIsCreateDialogOpen(true)}
            sx={{ width: 200 }}
          >
            创建直播间
          </Button>
        </Stack>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            当前直播
          </Typography>
          <Typography variant="body2" color="text.secondary">
            共 {rooms.length} 个直播间
          </Typography>
        </Stack>
        
        {rooms.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              当前没有正在直播的房间
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {rooms.map((room) => (
              <Grid item xs={12} sm={6} md={4} key={room.id}>
                <Card>
                  <CardActionArea onClick={() => handleJoinRoom(room.id)}>
                    <CardMedia
                      component="div"
                      sx={{
                        height: 140,
                        backgroundColor: 'grey.800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <VideocamIcon sx={{ fontSize: 60, color: 'grey.500' }} />
                    </CardMedia>
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div" noWrap>
                        {room.title}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {room.viewers.length} 人观看
                        </Typography>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog 
        open={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '500px',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          pb: 2
        }}>
          创建直播间
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            请输入直播间标题，让观众更容易找到你的直播
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="直播间标题"
            placeholder="例如：XXX的直播间"
            fullWidth
            variant="outlined"
            value={newRoomTitle}
            onChange={(e) => setNewRoomTitle(e.target.value)}
            InputProps={{
              sx: {
                borderRadius: 1.5
              }
            }}
            helperText={`${newRoomTitle.length}/50字`}
            inputProps={{
              maxLength: 50
            }}
          />
        </DialogContent>
        <DialogActions sx={{ 
          px: 3, 
          py: 2,
          borderTop: 1, 
          borderColor: 'divider' 
        }}>
          <Button 
            onClick={() => setIsCreateDialogOpen(false)}
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            取消
          </Button>
          <Button 
            onClick={handleCreateRoom} 
            disabled={!newRoomTitle.trim()}
            variant="contained"
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
          >
            创建
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 