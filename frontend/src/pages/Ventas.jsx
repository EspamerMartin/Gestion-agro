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
    animal: '',
    fecha: formatDateForInput(new Date()),
    comprador: '',
    precio: '',
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
        setRazasDisponibles(razasRes || []);
        setCamposDisponibles(camposRes || []);
        setLotesDisponibles(lotesRes || []);
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
        animal: '',
        fecha: formatDateForInput(new Date()),
        comprador: '',
        precio: '',
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

  const getLoteSeleccionado = () => {
    return lotesDisponibles.find(lote => lote.id === parseInt(formData.animal));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.animal) {
        throw new Error('Debe seleccionar un lote para vender');
      }

      if (!formData.precio || parseFloat(formData.precio) <= 0) {
        throw new Error('Debe ingresar un precio válido');
      }

      const ventaData = {
        animal: parseInt(formData.animal),
        fecha: formData.fecha,
        comprador: formData.comprador,
        precio: parseFloat(formData.precio),
        destino: formData.destino,
        observaciones: formData.observaciones,
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

  const loteSeleccionado = getLoteSeleccionado();

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
            <Grid item xs={12}>
              <Autocomplete
                options={lotesDisponibles || []}
                value={lotesDisponibles?.find(lote => lote.id === parseInt(formData.animal)) || null}
                getOptionLabel={(option) => {
                  if (!option) return '';
                  return `Lote ${option.lote_id} - ${option.raza} (${option.cantidad} animales) - Campo: ${option.campo}`;
                }}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, animal: newValue?.id?.toString() || '' });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    label="Lote a Vender"
                    variant="outlined"
                    required
                    fullWidth
                    helperText="Seleccione el lote completo que desea vender"
                  />
                )}
              />
            </Grid>
            
            {loteSeleccionado && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Información del Lote Seleccionado:
                  </Typography>
                  <Typography variant="body2">
                    • Raza: {loteSeleccionado.raza}
                  </Typography>
                  <Typography variant="body2">
                    • Cantidad: {loteSeleccionado.cantidad} animales
                  </Typography>
                  <Typography variant="body2">
                    • Campo actual: {loteSeleccionado.campo}
                  </Typography>
                </Paper>
              </Grid>
            )}
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="precio"
                label="Precio Total de Venta"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.precio}
                onChange={handleChange}
                required
                inputProps={{ min: 0, step: 1000 }}
                helperText={loteSeleccionado ? `Precio por ${loteSeleccionado.cantidad} animales` : "Precio total de la venta"}
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
            disabled={loading || !formData.animal || !formData.precio}
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
      setVentas(response || []);
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
        try {
          await loadVentas();
        } catch (reloadError) {
          console.error('Error al recargar datos:', reloadError);
          // No mostrar error por recarga, ya que la eliminación fue exitosa
        }
      } catch (error) {
        setError('Error al eliminar la venta');
      }
    }
  };

  const getTotalVentas = () => {
    return (ventas || []).reduce((total, venta) => total + (venta.precio || 0), 0);
  };

  const getTotalAnimales = () => {
    return (ventas || []).length; // Cada venta es un lote completo
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
                Lotes Vendidos
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {getTotalAnimales()}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Precio Promedio por Lote
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
                  <TableCell>Lote</TableCell>
                  <TableCell>Comprador</TableCell>
                  <TableCell>Precio Total</TableCell>
                  <TableCell>Destino</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
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
                        <Chip label={venta.animal_lote_id || `ID: ${venta.animal}`} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{venta.comprador}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                          {formatCurrency(venta.precio)}
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
