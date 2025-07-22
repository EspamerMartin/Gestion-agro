import { createTheme } from '@mui/material/styles';

// Paleta de colores verde profesional para gestión agropecuaria
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E7D32', // Verde principal
      light: '#4CAF50',
      dark: '#1B5E20',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#66BB6A', // Verde secundario
      light: '#81C784',
      dark: '#4CAF50',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
      dark: '#388E3C',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    error: {
      main: '#F44336',
      light: '#E57373',
      dark: '#D32F2F',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#1A1A1A',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#1A1A1A',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1A1A1A',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#1A1A1A',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#1A1A1A',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      color: '#1A1A1A',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 400,
      color: '#666666',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#1A1A1A',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
          padding: '8px 16px',
        },
        containedPrimary: {
          boxShadow: '0 2px 8px rgba(46, 125, 50, 0.2)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #E0E0E0',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#F5F5F5',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            color: '#1A1A1A',
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
});

export default theme;
