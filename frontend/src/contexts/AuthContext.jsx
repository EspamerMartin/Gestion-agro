import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  token: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Verificar si hay un token guardado en localStorage al iniciar
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user, token: savedToken } 
        });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (username, password) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }
      
      const data = await response.json();
      
      // Guardar token y datos del usuario
      localStorage.setItem('token', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      
      // Crear objeto de usuario (en Django JWT no viene info del user por defecto)
      const userData = {
        id: 1, // En un caso real, harías otra llamada para obtener los datos del usuario
        username,
        name: username,
        role: 'admin',
      };
      
      localStorage.setItem('user', JSON.stringify(userData));
      dispatch({ 
        type: 'LOGIN_SUCCESS', 
        payload: { user: userData, token: data.access } 
      });
      
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Por ahora, Django no tiene endpoint de registro personalizado
      // Se puede crear un usuario admin desde el backend
      throw new Error('Registro no disponible. Contacte al administrador.');
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
