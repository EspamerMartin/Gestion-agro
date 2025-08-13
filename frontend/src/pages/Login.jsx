import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES, APP_NAME } from '../constants';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Por favor complete todos los campos');
      return;
    }

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      navigate(ROUTES.DASHBOARD);
    } else {
      setError(result.error || 'Error al iniciar sesión');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'primary.main',
        backgroundImage: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 3,
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography component="h1" variant="h4" color="primary" sx={{ fontWeight: 600, mb: 1 }}>
              {APP_NAME}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sistema de Gestión Ganadera
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Usuario"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
              variant="outlined"
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to={ROUTES.REGISTER} variant="body2">
                ¿No tienes cuenta? Regístrate aquí
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
