import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import { preciosMercadoApi } from '../services/api';
import { formatDate, formatCurrency } from '../utils';
import { CHART_COLORS } from '../constants';

const PreciosMercado = () => {
  const [precios, setPrecios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  useEffect(() => {
    loadPrecios();
  }, []);

  const loadPrecios = async () => {
    try {
      setLoading(true);
      const response = await preciosMercadoApi.getAll();
      setPrecios(response.data);
    } catch (err) {
      setError('Error al cargar los precios de mercado');
      console.error('Error loading precios:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCategorias = () => {
    const categorias = [...new Set(precios.map(p => p.categoria))];
    return categorias;
  };

  const getPreciosFiltrados = () => {
    if (categoriaFiltro === 'todas') {
      return precios;
    }
    return precios.filter(p => p.categoria === categoriaFiltro);
  };

  const getEvolucionPrecios = () => {
    const categorias = getCategorias();
    const fechas = [...new Set(precios.map(p => p.fecha))].sort();
    
    return fechas.map(fecha => {
      const dataPoint = { fecha: formatDate(fecha) };
      categorias.forEach(categoria => {
        const precio = precios.find(p => p.fecha === fecha && p.categoria === categoria);
        dataPoint[categoria] = precio ? precio.precio : null;
      });
      return dataPoint;
    });
  };

  const getUltimosPreciosPorCategoria = () => {
    const categorias = getCategorias();
    const ultimaFecha = Math.max(...precios.map(p => new Date(p.fecha)));
    
    return categorias.map(categoria => {
      const preciosCategoria = precios.filter(p => p.categoria === categoria);
      const ultimoPrecio = preciosCategoria.find(p => new Date(p.fecha).getTime() === ultimaFecha);
      const anteriorPrecio = preciosCategoria[preciosCategoria.length - 2];
      
      const variacion = ultimoPrecio && anteriorPrecio 
        ? ((ultimoPrecio.precio - anteriorPrecio.precio) / anteriorPrecio.precio * 100)
        : 0;
      
      return {
        categoria,
        precio: ultimoPrecio ? ultimoPrecio.precio : 0,
        variacion: variacion.toFixed(1),
        fecha: ultimoPrecio ? ultimoPrecio.fecha : null,
      };
    });
  };

  const chartColors = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.accent1];

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  const evolucionData = getEvolucionPrecios();
  const ultimosPreciosData = getUltimosPreciosPorCategoria();
  const categorias = getCategorias();

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Precios de Mercado
            </Typography>
          </Box>
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={categoriaFiltro}
              label="Categoría"
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <MenuItem value="todas">Todas</MenuItem>
              {categorias.map((categoria) => (
                <MenuItem key={categoria} value={categoria}>
                  {categoria}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Price Cards */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {ultimosPreciosData.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={item.categoria}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {item.categoria}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {parseFloat(item.variacion) >= 0 ? (
                        <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      ) : (
                        <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20 }} />
                      )}
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          ml: 0.5,
                          color: parseFloat(item.variacion) >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 500
                        }}
                      >
                        {item.variacion}%
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main', mb: 1 }}>
                    {formatCurrency(item.precio)}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    Última actualización: {formatDate(item.fecha)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Evolución de Precios - Line Chart */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Evolución Histórica de Precios
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={evolucionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(value), name]}
                  />
                  {categorias.map((categoria, index) => (
                    <Line
                      key={categoria}
                      type="monotone"
                      dataKey={categoria}
                      stroke={chartColors[index % chartColors.length]}
                      strokeWidth={2}
                      dot={{ fill: chartColors[index % chartColors.length], strokeWidth: 2, r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Comparación Actual - Bar Chart */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Precios Actuales
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={ultimosPreciosData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="categoria" type="category" width={80} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Precio']}
                  />
                  <Bar dataKey="precio" fill={CHART_COLORS.primary} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Table */}
        <Paper sx={{ borderRadius: 2, mt: 3 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Historial Completo de Precios
            </Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell align="right">Precio (ARS/kg)</TableCell>
                  <TableCell align="center">Variación</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {getPreciosFiltrados()
                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                  .map((precio, index) => {
                    const preciosCategoria = precios.filter(p => p.categoria === precio.categoria);
                    const indicePrecio = preciosCategoria.findIndex(p => p.fecha === precio.fecha);
                    const precioAnterior = preciosCategoria[indicePrecio + 1];
                    
                    const variacion = precioAnterior 
                      ? ((precio.precio - precioAnterior.precio) / precioAnterior.precio * 100)
                      : null;

                    return (
                      <TableRow key={`${precio.fecha}-${precio.categoria}`} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AttachMoneyIcon sx={{ mr: 1, color: 'primary.main' }} />
                            {formatDate(precio.fecha)}
                          </Box>
                        </TableCell>
                        <TableCell>{precio.categoria}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {formatCurrency(precio.precio)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {variacion !== null && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {variacion >= 0 ? (
                                <TrendingUpIcon sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                              ) : (
                                <TrendingDownIcon sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                              )}
                              <Typography
                                variant="body2"
                                sx={{
                                  color: variacion >= 0 ? 'success.main' : 'error.main',
                                  fontWeight: 500
                                }}
                              >
                                {variacion.toFixed(1)}%
                              </Typography>
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          {getPreciosFiltrados().length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No hay precios disponibles
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Los precios se actualizan desde fuentes externas
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </DashboardLayout>
  );
};

export default PreciosMercado;
