import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import Sidebar from '../components/Sidebar';
import { SIDEBAR_WIDTH } from '../constants';

const DashboardLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, lg: 4 },
          ml: { xs: 0, lg: `${SIDEBAR_WIDTH}px` },
          width: { xs: '100%', lg: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
          overflowX: 'auto',
        }}
      >
        <Box sx={{ 
          maxWidth: '100%', 
          width: '100%',
          mx: 'auto'
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
