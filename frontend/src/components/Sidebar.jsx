import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Agriculture as AgricultureIcon,
  Pets as PetsIcon,
  Vaccines as VaccinesIcon,
  SwapHoriz as SwapHorizIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES, SIDEBAR_WIDTH, APP_NAME } from '../constants';
import { useAuth } from '../contexts/AuthContext';

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: ROUTES.DASHBOARD,
  },
  {
    text: 'Campos',
    icon: <AgricultureIcon />,
    path: ROUTES.CAMPOS,
  },
  {
    text: 'Vacunos',
    icon: <PetsIcon />,
    path: ROUTES.VACUNOS,
  },
  {
    text: 'Vacunas',
    icon: <VaccinesIcon />,
    path: ROUTES.VACUNAS,
  },
  {
    text: 'Transferencias',
    icon: <SwapHorizIcon />,
    path: ROUTES.TRANSFERENCIAS,
  },
  {
    text: 'Ventas',
    icon: <AttachMoneyIcon />,
    path: ROUTES.VENTAS,
  },
  {
    text: 'Precios de Mercado',
    icon: <TrendingUpIcon />,
    path: ROUTES.PRECIOS_MERCADO,
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: SIDEBAR_WIDTH,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        {/* Header */}
        <Box sx={{ p: 3, textAlign: 'center', backgroundColor: 'primary.main', color: 'white' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {APP_NAME}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
            Sistema de Gestión
          </Typography>
        </Box>

        {/* User Info */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', backgroundColor: 'background.paper' }}>
          <Avatar sx={{ width: 40, height: 40, mr: 2, backgroundColor: 'secondary.main' }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {user?.name || 'Usuario'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* Navigation Menu */}
        <List sx={{ px: 1, py: 2 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    minHeight: 48,
                    borderRadius: 2,
                    backgroundColor: isActive ? 'primary.main' : 'transparent',
                    color: isActive ? 'white' : 'text.primary',
                    '&:hover': {
                      backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                    },
                    mx: 1,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: 3,
                      color: isActive ? 'white' : 'primary.main',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider />

        {/* Logout */}
        <Box sx={{ p: 2, mt: 'auto' }}>
          <ListItemButton
            onClick={logout}
            sx={{
              borderRadius: 2,
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'error.light',
                color: 'white',
              },
            }}
          >
            <ListItemText
              primary="Cerrar Sesión"
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: 500,
                textAlign: 'center',
              }}
            />
          </ListItemButton>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
