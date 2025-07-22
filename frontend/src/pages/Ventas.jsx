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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Autocomplete,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  AttachMoney as AttachMoneyIcon,
  Sell as SellIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import DashboardLayout from '../layouts/DashboardLayout';
import { ventasApi, opcionesApi } from '../services/api';
import { formatDate, formatCurrency, formatDateForInput } from '../utils';

const VentaDialog = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    raza: '',
    cantidad: 1,
    campo_origen: '',
    fecha: formatDateForInput(new Date()),
    comprador: '',
    precio_por_cabeza: '',
    destino: '',
    observaciones: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [razasDisponibles, setRazasDisponibles] = useState([]);
  const [camposDisponibles, setCamposDisponibles] = useState([]);
  const [lotesDisponibles, setLotesDisponibles] = useState([]);

  // Cargar opciones cuando se abre el diálogo
  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        const [razasRes, camposRes, lotesRes] = await Promise.all([
          opcionesApi.getRazas(),
          opcionesApi.getCampos(),
          opcionesApi.getLotes()
        ]);
        setRazasDisponibles(razasRes.data);
        setCamposDisponibles(camposRes.data);
        setLotesDisponibles(lotesRes.data);
      } catch (error) {
        console.error('Error cargando opciones:', error);
      }
    };

    if (open) {
      cargarOpciones();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFormData({
        raza: '',
        cantidad: 1,
        campo_origen: '',
        fecha: formatDateForInput(new Date()),
        comprador: '',
        precio_por_cabeza: '',
        destino: '',
        observaciones: '',
      });
      setError('');
    }
  }, [open]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calcularPrecioTotal = () => {
    const cantidad = parseFloat(formData.cantidad) || 0;
    const precioPorCabeza = parseFloat(formData.precio_por_cabeza) || 0;
    return cantidad * precioPorCabeza;
  };

  const getLoteDisponible = () => {
    return lotesDisponibles.find(lote => 
      lote.raza === formData.raza && 
      lote.campo === formData.campo_origen &&
      lote.estado_actual === 'activo'
    );
  };

  const getCantidadDisponible = () => {
    const lote = getLoteDisponible();
    return lote ? lote.cantidad : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cantidadDisponible = getCantidadDisponible();
      if (formData.cantidad > cantidadDisponible) {
        throw new Error(`No hay suficientes animales disponibles. Disponible: ${cantidadDisponible}`);
      }

      const ventaData = {
        ...formData,
        precio_total: calcularPrecioTotal(),
        cantidad: parseInt(formData.cantidad),
        precio_por_cabeza: parseFloat(formData.precio_por_cabeza),
      };

      await ventasApi.create(ventaData);
      onSave();
      onClose();
    } catch (error) {
      setError(error.message || 'Error al registrar la venta');
    } finally {
      setLoading(false);
    }
  };

  const cantidadDisponible = getCantidadDisponible();
  const precioTotal = calcularPrecioTotal();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <SellIcon sx={{ mr: 1 }} />
            Registrar Venta
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={razasDisponibles}
                value={formData.raza}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, raza: newValue || '' });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    label="Raza"
                    variant="outlined"
                    required
                    fullWidth
                    helperText="Seleccione la raza de los animales a vender"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={camposDisponibles.map(campo => campo.nombre)}
                value={formData.campo_origen}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, campo_origen: newValue || '' });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    label="Campo de Origen"
                    variant="outlined"
                    required
                    fullWidth
                    helperText="Campo donde se encuentran los animales"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="cantidad"
                label="Cantidad"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.cantidad}
                onChange={handleChange}
                required
                inputProps={{ min: 1, max: cantidadDisponible }}
                helperText={
                  cantidadDisponible > 0 
                    ? `Disponible: ${cantidadDisponible} animales`
                    : formData.raza && formData.campo_origen 
                      ? "No hay animales disponibles para esta combinación"
                      : "Seleccione raza y campo para ver disponibilidad"
                }
                error={formData.cantidad > cantidadDisponible}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="precio_por_cabeza"
                label="Precio por Cabeza"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.precio_por_cabeza}
                onChange={handleChange}
                required
                inputProps={{ min: 0, step: 1000 }}
                helperText={precioTotal > 0 ? `Total: ${formatCurrency(precioTotal)}` : ""}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="fecha"
                label="Fecha de Venta"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.fecha}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="comprador"
                label="Comprador"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.comprador}
                onChange={handleChange}
                required
                placeholder="ej: Frigorífico San José"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="destino"
                label="Destino"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.destino}
                onChange={handleChange}
                placeholder="ej: Exportación, Mercado interno"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                margin="dense"
                name="observaciones"
                label="Observaciones"
                multiline
                rows={3}
                fullWidth
                variant="outlined"
                value={formData.observaciones}
                onChange={handleChange}
                placeholder="Observaciones adicionales sobre la venta"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || formData.cantidad > cantidadDisponible || cantidadDisponible === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <SellIcon />}
          >
            {loading ? 'Registrando...' : 'Registrar Venta'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const loadVentas = async () => {
    try {
      setLoading(true);
      const response = await ventasApi.getAll();
      setVentas(response.data);
    } catch (error) {
      setError('Error al cargar las ventas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVentas();
  }, []);

  const handleSave = () => {
    loadVentas();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta venta?')) {
      try {
        await ventasApi.delete(id);
        loadVentas();
      } catch (error) {
        setError('Error al eliminar la venta');
      }
    }
  };

  const getTotalVentas = () => {
    return ventas.reduce((total, venta) => total + (venta.precio_total || 0), 0);
  };

  const getTotalAnimales = () => {
    return ventas.reduce((total, venta) => total + (venta.cantidad || 0), 0);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Gestión de Ventas
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Estadísticas rápidas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <AttachMoneyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" color="primary">
                Total Vendido
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(getTotalVentas())}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <SellIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" color="secondary">
                Animales Vendidos
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {getTotalAnimales()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Precio Promedio
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {getTotalAnimales() > 0 
                  ? formatCurrency(getTotalVentas() / getTotalAnimales())
                  : formatCurrency(0)
                }
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Lista de Ventas ({ventas.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Nueva Venta
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Raza</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Campo</TableCell>
                  <TableCell>Comprador</TableCell>
                  <TableCell>Precio/Cabeza</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Destino</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No hay ventas registradas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  ventas.map((venta) => (
                    <TableRow key={venta.id}>
                      <TableCell>{formatDate(venta.fecha)}</TableCell>
                      <TableCell>
                        <Chip label={venta.raza} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{venta.cantidad}</TableCell>
                      <TableCell>{venta.campo_origen}</TableCell>
                      <TableCell>{venta.comprador}</TableCell>
                      <TableCell>{formatCurrency(venta.precio_por_cabeza)}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {formatCurrency(venta.precio_total)}
                        </Typography>
                      </TableCell>
                      <TableCell>{venta.destino || '-'}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(venta.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <VentaDialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          onSave={handleSave}
        />
      </Box>
    </DashboardLayout>
  );
};

export default Ventas;
