// Constantes de la aplicación

export const APP_NAME = 'Gestión Agro';

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/',
  CAMPOS: '/campos',
  VACUNOS: '/vacunos',
  VACUNAS: '/vacunas',
  TRANSFERENCIAS: '/transferencias',
  VENTAS: '/ventas',
};

export const SEXO_CHOICES = [
  { value: 'M', label: 'Macho' },
  { value: 'H', label: 'Hembra' },
];

export const CICLO_PRODUCTIVO_CHOICES = [
  { value: 'ternero', label: 'Ternero' },
  { value: 'novillo', label: 'Novillo' },
  { value: 'toro', label: 'Toro' },
  { value: 'ternera', label: 'Ternera' },
  { value: 'vaquillona', label: 'Vaquillona' },
  { value: 'vaca', label: 'Vaca' },
];

export const ESTADO_SALUD_CHOICES = [
  { value: 'sano', label: 'Sano' },
  { value: 'brucelosis', label: 'Brucelosis' },
  { value: 'tuberculosis', label: 'Tuberculosis' },
  { value: 'otra', label: 'Otra' },
];

export const ESTADO_GENERAL_CHOICES = [
  { value: 'activo', label: 'Activo' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'muerto', label: 'Muerto' },
  { value: 'transferido', label: 'Transferido' },
];

export const SIDEBAR_WIDTH = 240;

export const CHART_COLORS = {
  primary: '#2E7D32',
  secondary: '#4FC3F7', 
  accent1: '#FF6B35',
  accent2: '#F7931E',
  accent3: '#9C27B0',
  accent4: '#E91E63',
  accent5: '#00BCD4',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  success: '#4CAF50',
  // Colores específicos para gráficos de torta más vivos
  pie: [
    '#2E7D32', // Verde principal
    '#4FC3F7', // Azul claro
    '#FF6B35', // Naranja vibrante
    '#F7931E', // Amarillo naranja
    '#9C27B0', // Púrpura
    '#E91E63', // Rosa
    '#00BCD4', // Cian
    '#8BC34A', // Verde claro
    '#FF5722', // Rojo naranja
    '#607D8B', // Azul gris
  ]
};

export const DATE_FORMATS = {
  display: 'dd/MM/yyyy',
  input: 'yyyy-MM-dd',
};
