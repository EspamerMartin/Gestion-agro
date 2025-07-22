// API Mock completamente integrada y dinámica

import { generateId } from '../utils';
import { 
  calculateDashboardStats, 
  getMockData, 
  updateMockData, 
  RAZAS_DISPONIBLES, 
  VACUNAS_DISPONIBLES 
} from './mockData';

// Simulación de delay de red
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// API Mock para Dashboard con datos dinámicos
export const dashboardApi = {
  getStats: async () => {
    await delay();
    return {
      data: calculateDashboardStats(),
    };
  },
};

// API Mock para Campos con datos dinámicos
export const camposApi = {
  getAll: async () => {
    await delay();
    const data = getMockData();
    return { data: data.campos };
  },
  
  create: async (campoData) => {
    await delay();
    const data = getMockData();
    const newCampo = {
      ...campoData,
      id: generateId(),
      hectareas: parseInt(campoData.hectareas), // Asegurar que sea entero
    };
    data.campos.push(newCampo);
    updateMockData('campos', data.campos);
    return { data: newCampo };
  },
  
  update: async (id, campoData) => {
    await delay();
    const data = getMockData();
    const index = data.campos.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Campo no encontrado');
    data.campos[index] = { 
      ...data.campos[index], 
      ...campoData,
      hectareas: parseInt(campoData.hectareas) // Asegurar que sea entero
    };
    updateMockData('campos', data.campos);
    return { data: data.campos[index] };
  },
  
  delete: async (id) => {
    await delay();
    const data = getMockData();
    const index = data.campos.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Campo no encontrado');
    data.campos.splice(index, 1);
    updateMockData('campos', data.campos);
    return { data: { message: 'Campo eliminado' } };
  },
  
  // Nueva función para obtener lista de nombres de campos
  getNombres: async () => {
    await delay();
    const data = getMockData();
    return { data: data.campos.map(c => c.nombre) };
  },
};

// API Mock para Vacunos con datos dinámicos
export const vacunosApi = {
  getAll: async () => {
    await delay();
    const data = getMockData();
    return { data: data.vacunos };
  },
  
  create: async (vacunoData) => {
    await delay();
    const data = getMockData();
    const newVacuno = {
      ...vacunoData,
      id: generateId(),
      cantidad: parseInt(vacunoData.cantidad),
    };
    data.vacunos.push(newVacuno);
    updateMockData('vacunos', data.vacunos);
    return { data: newVacuno };
  },
  
  update: async (id, vacunoData) => {
    await delay();
    const data = getMockData();
    const index = data.vacunos.findIndex(v => v.id === id);
    if (index === -1) throw new Error('Lote no encontrado');
    data.vacunos[index] = { 
      ...data.vacunos[index], 
      ...vacunoData,
      cantidad: parseInt(vacunoData.cantidad)
    };
    updateMockData('vacunos', data.vacunos);
    return { data: data.vacunos[index] };
  },
  
  delete: async (id) => {
    await delay();
    const data = getMockData();
    const index = data.vacunos.findIndex(v => v.id === id);
    if (index === -1) throw new Error('Lote no encontrado');
    data.vacunos.splice(index, 1);
    updateMockData('vacunos', data.vacunos);
    return { data: { message: 'Lote eliminado' } };
  },
};

// API Mock para Vacunaciones con datos dinámicos
export const vacunasApi = {
  getAll: async () => {
    await delay();
    const data = getMockData();
    return { data: data.vacunaciones };
  },
  
  create: async (vacunacionData) => {
    await delay();
    const data = getMockData();
    const newVacunacion = {
      ...vacunacionData,
      id: generateId(),
      cantidad_animales: parseInt(vacunacionData.cantidad_animales),
    };
    data.vacunaciones.push(newVacunacion);
    updateMockData('vacunaciones', data.vacunaciones);
    return { data: newVacunacion };
  },
  
  update: async (id, vacunacionData) => {
    await delay();
    const data = getMockData();
    const index = data.vacunaciones.findIndex(v => v.id === id);
    if (index === -1) throw new Error('Vacunación no encontrada');
    data.vacunaciones[index] = { 
      ...data.vacunaciones[index], 
      ...vacunacionData,
      cantidad_animales: parseInt(vacunacionData.cantidad_animales)
    };
    updateMockData('vacunaciones', data.vacunaciones);
    return { data: data.vacunaciones[index] };
  },
  
  delete: async (id) => {
    await delay();
    const data = getMockData();
    const index = data.vacunaciones.findIndex(v => v.id === id);
    if (index === -1) throw new Error('Vacunación no encontrada');
    data.vacunaciones.splice(index, 1);
    updateMockData('vacunaciones', data.vacunaciones);
    return { data: { message: 'Vacunación eliminada' } };
  },
};

// API Mock para Transferencias
export const transferenciasApi = {
  getAll: async () => {
    await delay();
    const data = getMockData();
    return { data: data.transferencias };
  },
  
  create: async (transferenciaData) => {
    await delay();
    const data = getMockData();
    const newTransferencia = {
      ...transferenciaData,
      id: generateId(),
      cantidad: parseInt(transferenciaData.cantidad),
    };
    data.transferencias.push(newTransferencia);
    updateMockData('transferencias', data.transferencias);
    
    // Actualizar los lotes de vacunos afectados
    const loteOrigen = data.vacunos.find(v => 
      v.raza === transferenciaData.raza && 
      v.campo === transferenciaData.campo_origen &&
      v.estado_actual === 'activo'
    );
    
    if (loteOrigen) {
      const cantidadTransferida = parseInt(transferenciaData.cantidad);
      
      // Reducir cantidad del lote de origen
      loteOrigen.cantidad -= cantidadTransferida;
      
      // Si se redujo a 0, marcarlo como transferido
      if (loteOrigen.cantidad <= 0) {
        loteOrigen.estado_actual = 'transferido';
      }
      
      // Buscar si ya existe un lote de la misma raza en el campo destino
      const loteDestino = data.vacunos.find(v => 
        v.raza === transferenciaData.raza && 
        v.campo === transferenciaData.campo_destino &&
        v.estado_actual === 'activo'
      );
      
      if (loteDestino) {
        // Si existe, sumar la cantidad
        loteDestino.cantidad += cantidadTransferida;
      } else {
        // Si no existe, crear un nuevo lote en el destino
        const nuevoLote = {
          ...loteOrigen,
          id: generateId(),
          campo: transferenciaData.campo_destino,
          cantidad: cantidadTransferida,
          fecha_ingreso: transferenciaData.fecha,
          observaciones: `Transferido desde ${transferenciaData.campo_origen}`,
          estado_actual: 'activo',
        };
        data.vacunos.push(nuevoLote);
      }
      
      updateMockData('vacunos', data.vacunos);
    }
    
    return { data: newTransferencia };
  },
  
  delete: async (id) => {
    await delay();
    const data = getMockData();
    const index = data.transferencias.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transferencia no encontrada');
    data.transferencias.splice(index, 1);
    updateMockData('transferencias', data.transferencias);
    return { data: { message: 'Transferencia eliminada' } };
  },
};

// API Mock para Ventas
export const ventasApi = {
  getAll: async () => {
    await delay();
    const data = getMockData();
    return { data: data.ventas };
  },
  
  create: async (ventaData) => {
    await delay();
    const data = getMockData();
    const newVenta = {
      ...ventaData,
      id: generateId(),
      cantidad: parseInt(ventaData.cantidad),
      precio_por_cabeza: parseFloat(ventaData.precio_por_cabeza),
      precio_total: parseInt(ventaData.cantidad) * parseFloat(ventaData.precio_por_cabeza),
    };
    data.ventas.push(newVenta);
    updateMockData('ventas', data.ventas);
    
    // Reducir la cantidad del lote vendido
    const loteAfectado = data.vacunos.find(v => 
      v.raza === ventaData.raza && 
      v.campo === ventaData.campo_origen
    );
    
    if (loteAfectado) {
      loteAfectado.cantidad -= parseInt(ventaData.cantidad);
      if (loteAfectado.cantidad <= 0) {
        // Si se vendió todo el lote, marcarlo como vendido
        loteAfectado.estado_actual = 'vendido';
      }
      updateMockData('vacunos', data.vacunos);
    }
    
    return { data: newVenta };
  },
  
  delete: async (id) => {
    await delay();
    const data = getMockData();
    const index = data.ventas.findIndex(v => v.id === id);
    if (index === -1) throw new Error('Venta no encontrada');
    data.ventas.splice(index, 1);
    updateMockData('ventas', data.ventas);
    return { data: { message: 'Venta eliminada' } };
  },
};

// API para obtener opciones de formularios
export const opcionesApi = {
  getRazas: async () => {
    await delay();
    return { data: RAZAS_DISPONIBLES };
  },
  
  getVacunas: async () => {
    await delay();
    return { data: VACUNAS_DISPONIBLES };
  },
  
  getCampos: async () => {
    await delay();
    const data = getMockData();
    return { data: data.campos };
  },

  getLotes: async () => {
    await delay();
    const data = getMockData();
    return { data: data.vacunos.filter(v => v.estado_actual === 'activo') };
  },
  
  getLotesPorCampo: async (campo) => {
    await delay();
    const data = getMockData();
    const lotes = data.vacunos
      .filter(v => v.campo === campo && v.estado_actual === 'activo')
      .map(v => ({
        id: v.id,
        raza: v.raza,
        cantidad: v.cantidad,
        ciclo_productivo: v.ciclo_productivo,
      }));
    return { data: lotes };
  },
};

// API Mock para Precios de Mercado (sin cambios por ahora)
const mockPreciosMercado = [
  { fecha: '2024-01-01', categoria: 'Ternero', precio: 1650 },
  { fecha: '2024-01-01', categoria: 'Novillo', precio: 1850 },
  { fecha: '2024-01-01', categoria: 'Vaca', precio: 1550 },
  { fecha: '2024-01-08', categoria: 'Ternero', precio: 1680 },
  { fecha: '2024-01-08', categoria: 'Novillo', precio: 1870 },
  { fecha: '2024-01-08', categoria: 'Vaca', precio: 1580 },
];

export const preciosMercadoApi = {
  getAll: async () => {
    await delay();
    return { data: mockPreciosMercado };
  },
};
