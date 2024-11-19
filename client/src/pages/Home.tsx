import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stack,
} from '@mui/material';

export default function Home() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substr(2, 9);
    navigate(`/broadcast/${newRoomId}`);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      navigate(`/view/${roomId}`);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            直播平台
          </Typography>
          <Stack spacing={3}>
            <Button
              variant="contained"
              size="large"
              onClick={handleCreateRoom}
              fullWidth
            >
              创建直播间
            </Button>
            <Typography variant="h6" align="center">
              或
            </Typography>
            <TextField
              label="输入房间号"
              variant="outlined"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              fullWidth
            />
            <Button
              variant="contained"
              size="large"
              onClick={handleJoinRoom}
              disabled={!roomId.trim()}
              fullWidth
            >
              加入直播间
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Container>
  );
} 