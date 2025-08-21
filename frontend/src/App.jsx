import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { es } from 'date-fns/locale';

// Theme
import theme from './theme';

// Contexts
import { AuthProvider } from './contexts/AuthContext';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Campos from './pages/Campos';
import Vacunos from './pages/Vacunos';
import Vacunas from './pages/Vacunas';
import Transferencias from './pages/Transferencias';
import Ventas from './pages/Ventas';

// Constants
import { ROUTES } from './constants';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Rutas públicas */}
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.REGISTER} element={<Register />} />
              
              {/* Rutas protegidas */}
              <Route
                path={ROUTES.DASHBOARD}
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.CAMPOS}
                element={
                  <ProtectedRoute>
                    <Campos />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.VACUNOS}
                element={
                  <ProtectedRoute>
                    <Vacunos />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.VACUNAS}
                element={
                  <ProtectedRoute>
                    <Vacunas />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.TRANSFERENCIAS}
                element={
                  <ProtectedRoute>
                    <Transferencias />
                  </ProtectedRoute>
                }
              />
              <Route
                path={ROUTES.VENTAS}
                element={
                  <ProtectedRoute>
                    <Ventas />
                  </ProtectedRoute>
                }
              />
              
              {/* Ruta por defecto */}
              <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
