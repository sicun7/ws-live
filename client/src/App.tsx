import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Home from './pages/Home';
import BroadcastRoom from './pages/BroadcastRoom';
import ViewerRoom from './pages/ViewerRoom';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/broadcast/:roomId" element={<BroadcastRoom />} />
          <Route path="/view/:roomId" element={<ViewerRoom />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 