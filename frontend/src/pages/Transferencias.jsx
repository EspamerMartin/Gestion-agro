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
  SwapHoriz as SwapHorizIcon,
  Delete as DeleteIcon,
  Agriculture as AgricultureIcon,
} from '@mui/icons-material';
import DashboardLayout from '../layouts/DashboardLayout';
import { transferenciasApi, opcionesApi } from '../services/api';
import { formatDate, formatDateForInput } from '../utils';

const TransferenciaDialog = ({ open, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    raza: '',
    cantidad: 1,
    campo_origen: '',
    campo_destino: '',
    fecha: formatDateForInput(new Date()),
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
        raza: '',
        cantidad: 1,
        campo_origen: '',
        campo_destino: '',
        fecha: formatDateForInput(new Date()),
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

  const getCamposDisponiblesParaDestino = () => {
    return camposDisponibles.filter(campo => 
      campo.nombre !== formData.campo_origen
    );
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

      if (formData.campo_origen === formData.campo_destino) {
        throw new Error('El campo de origen y destino no pueden ser el mismo');
      }

      const transferenciaData = {
        ...formData,
        cantidad: parseInt(formData.cantidad),
      };

      await transferenciasApi.create(transferenciaData);
      onSave();
      onClose();
    } catch (error) {
      setError(error.message || 'Error al registrar la transferencia');
    } finally {
      setLoading(false);
    }
  };

  const cantidadDisponible = getCantidadDisponible();
  const camposDestino = getCamposDisponiblesParaDestino();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <SwapHorizIcon sx={{ mr: 1 }} />
            Nueva Transferencia
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
                    helperText="Seleccione la raza de los animales"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={camposDisponibles.map(campo => campo.nombre)}
                value={formData.campo_origen}
                onChange={(event, newValue) => {
                  setFormData({ 
                    ...formData, 
                    campo_origen: newValue || '',
                    campo_destino: '' // Reset destino cuando cambia origen
                  });
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
              <Autocomplete
                options={camposDestino.map(campo => campo.nombre)}
                value={formData.campo_destino}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, campo_destino: newValue || '' });
                }}
                disabled={!formData.campo_origen}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    label="Campo de Destino"
                    variant="outlined"
                    required
                    fullWidth
                    helperText="Campo al que se transferirán los animales"
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
                name="fecha"
                label="Fecha de Transferencia"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.fecha}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
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
                placeholder="Observaciones adicionales sobre la transferencia"
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
            startIcon={loading ? <CircularProgress size={20} /> : <SwapHorizIcon />}
          >
            {loading ? 'Registrando...' : 'Registrar Transferencia'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const Transferencias = () => {
  const [transferencias, setTransferencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  const loadTransferencias = async () => {
    try {
      setLoading(true);
      const response = await transferenciasApi.getAll();
      setTransferencias(response || []);
    } catch (error) {
      setError('Error al cargar las transferencias');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransferencias();
  }, []);

  const handleSave = () => {
    loadTransferencias();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta transferencia?')) {
      try {
        await transferenciasApi.delete(id);
        loadTransferencias();
      } catch (error) {
        setError('Error al eliminar la transferencia');
      }
    }
  };

  const getTotalAnimalesTransferidos = () => {
    return transferencias.reduce((total, transferencia) => total + (transferencia.cantidad || 0), 0);
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
          Gestión de Transferencias
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Estadísticas rápidas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <SwapHorizIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" color="primary">
                Total de Transferencias
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {transferencias?.length || 0}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <AgricultureIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" color="secondary">
                Animales Transferidos
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {getTotalAnimalesTransferidos()}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ mb: 3 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Lista de Transferencias ({transferencias.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Nueva Transferencia
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Raza</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Campo Origen</TableCell>
                  <TableCell>Campo Destino</TableCell>
                  <TableCell>Observaciones</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transferencias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        No hay transferencias registradas
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transferencias.map((transferencia) => (
                    <TableRow key={transferencia.id}>
                      <TableCell>{formatDate(transferencia.fecha)}</TableCell>
                      <TableCell>
                        <Chip label={transferencia.raza} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{transferencia.cantidad}</TableCell>
                      <TableCell>{transferencia.campo_origen}</TableCell>
                      <TableCell>{transferencia.campo_destino}</TableCell>
                      <TableCell>{transferencia.observaciones || '-'}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(transferencia.id)}
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

        <TransferenciaDialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          onSave={handleSave}
        />
      </Box>
    </DashboardLayout>
  );
};

export default Transferencias;
