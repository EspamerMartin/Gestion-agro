// Configuración base de la API
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Función helper para realizar peticiones HTTP
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Obtener token del localStorage
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado o inválido
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Si la respuesta es paginada, devolver solo los results
    if (data && typeof data === 'object' && data.results && Array.isArray(data.results)) {
      return data.results;
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// API para Campos
export const camposApi = {
  getAll: () => apiRequest('/campos/'),
  getById: (id) => apiRequest(`/campos/${id}/`),
  create: (data) => apiRequest('/campos/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/campos/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/campos/${id}/`, {
    method: 'DELETE',
  }),
};

// API para Vacunos
export const vacunosApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/vacunos/${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/vacunos/${id}/`),
  create: (data) => apiRequest('/vacunos/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/vacunos/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/vacunos/${id}/`, {
    method: 'DELETE',
  }),
};

// API para Vacunas
export const vacunasApi = {
  getAll: () => apiRequest('/vacunas/'),
  getById: (id) => apiRequest(`/vacunas/${id}/`),
  create: (data) => apiRequest('/vacunas/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/vacunas/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/vacunas/${id}/`, {
    method: 'DELETE',
  }),
};

// API para Vacunaciones
export const vacunacionesApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/vacunaciones/${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/vacunaciones/${id}/`),
  create: (data) => apiRequest('/vacunaciones/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/vacunaciones/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/vacunaciones/${id}/`, {
    method: 'DELETE',
  }),
};

// API para Transferencias
export const transferenciasApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/transferencias/${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/transferencias/${id}/`),
  create: (data) => apiRequest('/transferencias/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/transferencias/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/transferencias/${id}/`, {
    method: 'DELETE',
  }),
};

// API para Ventas
export const ventasApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/ventas/${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/ventas/${id}/`),
  create: (data) => apiRequest('/ventas/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/ventas/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/ventas/${id}/`, {
    method: 'DELETE',
  }),
};

// API para Precios de Mercado
export const preciosMercadoApi = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/precios-mercado/${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/precios-mercado/${id}/`),
  create: (data) => apiRequest('/precios-mercado/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id, data) => apiRequest(`/precios-mercado/${id}/`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id) => apiRequest(`/precios-mercado/${id}/`, {
    method: 'DELETE',
  }),
};

// API para Dashboard (estadísticas)
export const dashboardApi = {
  getStats: () => apiRequest('/dashboard/stats/'),
};

// API para opciones (datos de selects, etc.)
export const opcionesApi = {
  getAll: () => apiRequest('/opciones/all/'),
  getRazas: () => apiRequest('/opciones/all/').then(data => data?.razas_disponibles || []),
  getCampos: () => apiRequest('/campos/'),
  getVacunas: () => apiRequest('/vacunas/'),
  getLotes: () => apiRequest('/opciones/all/').then(data => data?.vacunas || []), // Usando vacunas como "lotes" por ahora
  getEstados: () => apiRequest('/opciones/all/').then(data => ({
    sexos: data?.sexos_disponibles || [],
    ciclos: data?.ciclos_productivos || [],
    salud: data?.estados_salud || [],
    generales: data?.estados_generales || []
  })),
};
