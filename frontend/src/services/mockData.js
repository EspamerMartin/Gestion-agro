// Sistema de datos mock dinámico y conectado

// Razas predefinidas
export const RAZAS_DISPONIBLES = [
  'Aberdeen Angus',
  'Hereford', 
  'Braford',
  'Brangus',
  'Charolais',
  'Limousin',
  'Shorthorn',
  'Criollo',
];

// Vacunas predefinidas
export const VACUNAS_DISPONIBLES = [
  'Aftosa',
  'Brucelosis',
  'Triple (Carbunclo + Mancha + Gangrena)',
  'Clostridiosis',
  'Diarrea Viral Bovina (DVB)',
  'Rinotraqueítis (IBR)',
  'Campylobacteriosis',
  'Leptospirosis',
];

// Datos mock conectados
let mockCampos = [
  {
    id: '1',
    nombre: 'Campo Norte',
    ubicacion: 'La Pampa RN9 KM70',
    hectareas: 1250,
    descripcion: 'Campo principal con buenas pasturas',
    capacidad_maxima: 500,
  },
  {
    id: '2', 
    nombre: 'Campo Sur',
    ubicacion: 'Buenos Aires RP205 KM120',
    hectareas: 850,
    descripcion: 'Campo secundario para engorde',
    capacidad_maxima: 350,
  },
  {
    id: '3',
    nombre: 'Campo Este',
    ubicacion: 'Córdoba RP36 KM45',
    hectareas: 600,
    descripcion: 'Campo para cría',
    capacidad_maxima: 250,
  },
];

let mockVacunos = [
  {
    id: '1',
    raza: 'Aberdeen Angus',
    cantidad: 125,
    sexo: 'M',
    fecha_nacimiento: '2022-03-15',
    fecha_ingreso: '2024-01-10',
    campo: 'Campo Norte',
    estado_actual: 'activo',
    ciclo_productivo: 'novillo',
    observaciones: 'Lote de novillos para engorde',
  },
  {
    id: '2',
    raza: 'Hereford',
    cantidad: 89,
    sexo: 'H',
    fecha_nacimiento: '2021-08-22',
    fecha_ingreso: '2023-12-05',
    campo: 'Campo Sur',
    estado_actual: 'activo',
    ciclo_productivo: 'vaca',
    observaciones: 'Vacas de cría',
  },
  {
    id: '3',
    raza: 'Braford',
    cantidad: 67,
    sexo: 'M',
    fecha_nacimiento: '2023-01-10',
    fecha_ingreso: '2024-02-01',
    campo: 'Campo Este',
    estado_actual: 'activo',
    ciclo_productivo: 'ternero',
    observaciones: 'Terneros recién ingresados',
  },
  {
    id: '4',
    raza: 'Aberdeen Angus',
    cantidad: 45,
    sexo: 'H',
    fecha_nacimiento: '2020-11-05',
    fecha_ingreso: '2023-06-15',
    campo: 'Campo Norte',
    estado_actual: 'activo',
    ciclo_productivo: 'vaca',
    observaciones: 'Vacas reproductoras',
  },
  {
    id: '5',
    raza: 'Brangus',
    cantidad: 12,
    sexo: 'M',
    fecha_nacimiento: '2019-04-20',
    fecha_ingreso: '2022-08-10',
    campo: 'Campo Sur',
    estado_actual: 'activo',
    ciclo_productivo: 'toro',
    observaciones: 'Toros reproductores',
  },
];

let mockVacunaciones = [
  {
    id: '1',
    campo: 'Campo Norte',
    tipo_vacuna: 'Aftosa',
    fecha_aplicacion: '2024-01-15',
    cantidad_animales: 170,
    veterinario: 'Dr. Juan Pérez',
    observaciones: 'Vacunación anual contra aftosa',
  },
  {
    id: '2',
    campo: 'Campo Sur',
    tipo_vacuna: 'Brucelosis',
    fecha_aplicacion: '2024-01-20',
    cantidad_animales: 101,
    veterinario: 'Dra. María González',
    observaciones: 'Revacunación hembras',
  },
];

let mockTransferencias = [
  {
    id: '1',
    raza: 'Aberdeen Angus',
    cantidad: 25,
    campo_origen: 'Campo Sur',
    campo_destino: 'Campo Norte',
    fecha: '2024-01-15',
    observaciones: 'Transferencia para engorde',
  },
];

let mockVentas = [
  {
    id: '1',
    raza: 'Aberdeen Angus',
    cantidad: 30,
    campo_origen: 'Campo Norte',
    fecha: '2024-01-20',
    comprador: 'Frigorífico San José',
    precio_por_cabeza: 450000,
    precio_total: 13500000,
    destino: 'Exportación',
    observaciones: 'Novillos terminados',
  },
  {
    id: '2',
    raza: 'Hereford',
    cantidad: 15,
    campo_origen: 'Campo Sur',
    fecha: '2024-01-25',
    comprador: 'Carnicería El Buen Corte',
    precio_por_cabeza: 380000,
    precio_total: 5700000,
    destino: 'Mercado interno',
    observaciones: 'Vacas de descarte',
  },
];

// Funciones para cálculos dinámicos
export const calculateDashboardStats = () => {
  // Calcular total de animales
  const totalAnimales = mockVacunos
    .filter(v => v.estado_actual === 'activo')
    .reduce((total, lote) => total + lote.cantidad, 0);

  // Calcular animales por campo
  const animalesPorCampo = mockCampos.map(campo => {
    const cantidadEnCampo = mockVacunos
      .filter(v => v.campo === campo.nombre && v.estado_actual === 'activo')
      .reduce((total, lote) => total + lote.cantidad, 0);

    return {
      campo: campo.nombre,
      cantidad: cantidadEnCampo,
    };
  });

  // Calcular animales por ciclo productivo (usando nombres descriptivos)
  const animalesPorCiclo = mockVacunos
    .filter(v => v.estado_actual === 'activo')
    .reduce((acc, lote) => {
      const cicloDisplay = {
        'ternero': 'Terneros',
        'novillo': 'Novillos', 
        'toro': 'Toros',
        'ternera': 'Terneras',
        'vaquillona': 'Vaquillonas',
        'vaca': 'Vacas'
      };
      
      const cicloNombre = cicloDisplay[lote.ciclo_productivo] || lote.ciclo_productivo;
      const existing = acc.find(item => item.ciclo === cicloNombre);
      if (existing) {
        existing.cantidad += lote.cantidad;
      } else {
        acc.push({
          ciclo: cicloNombre,
          cantidad: lote.cantidad,
        });
      }
      return acc;
    }, []);

  // Calcular capacidad de campos
  const capacidadCampos = mockCampos.map(campo => {
    const cantidadEnCampo = mockVacunos
      .filter(v => v.campo === campo.nombre && v.estado_actual === 'activo')
      .reduce((total, lote) => total + lote.cantidad, 0);

    const capacidadUsada = ((cantidadEnCampo / campo.capacidad_maxima) * 100).toFixed(1);

    return {
      campo: campo.nombre,
      animales: cantidadEnCampo,
      capacidad_usada: parseFloat(capacidadUsada),
      capacidad_maxima: campo.capacidad_maxima,
    };
  });

  return {
    total_animales: totalAnimales,
    animales_por_campo: animalesPorCampo,
    animales_por_ciclo: animalesPorCiclo,
    capacidad_campos: capacidadCampos,
  };
};

// Exportar datos para uso en API
export const getMockData = () => ({
  campos: mockCampos,
  vacunos: mockVacunos,
  vacunaciones: mockVacunaciones,
  transferencias: mockTransferencias,
  ventas: mockVentas,
});

// Funciones para modificar datos
export const updateMockData = (type, data) => {
  switch (type) {
    case 'campos':
      mockCampos = data;
      break;
    case 'vacunos':
      mockVacunos = data;
      break;
    case 'vacunaciones':
      mockVacunaciones = data;
      break;
    case 'transferencias':
      mockTransferencias = data;
      break;
    case 'ventas':
      mockVentas = data;
      break;
  }
};
