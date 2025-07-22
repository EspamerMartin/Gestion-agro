import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

// Formatear fecha para mostrar
export const formatDate = (date, formatString = 'dd/MM/yyyy') => {
  if (!date) return '';
  
  let dateObj = date;
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  }
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, formatString, { locale: es });
};

// Formatear fecha para input
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  let dateObj = date;
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  }
  
  if (!isValid(dateObj)) return '';
  
  return format(dateObj, 'yyyy-MM-dd');
};

// Calcular edad en años
export const calculateAge = (birthDate) => {
  if (!birthDate) return null;
  
  const today = new Date();
  let dateObj = birthDate;
  
  if (typeof birthDate === 'string') {
    dateObj = parseISO(birthDate);
  }
  
  if (!isValid(dateObj)) return null;
  
  const years = today.getFullYear() - dateObj.getFullYear();
  const monthDiff = today.getMonth() - dateObj.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
    return years - 1;
  }
  
  return years;
};

// Formatear número con separador de miles
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined) return '0';
  return Number(number).toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Formatear moneda
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '$0';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Capitalizar primera letra
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Generar ID único simple
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
