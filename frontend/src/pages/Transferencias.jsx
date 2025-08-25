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
    animal: '',
    campo_origen: '',
    campo_destino: '',
    fecha: formatDateForInput(new Date()),
    observaciones: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lotesDisponibles, setLotesDisponibles] = useState([]);
  const [camposDisponibles, setCamposDisponibles] = useState([]);

  // Cargar opciones cuando se abre el diálogo
  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        const [lotesRes, camposRes] = await Promise.all([
          opcionesApi.getLotes(),
          opcionesApi.getCampos()
        ]);
        setLotesDisponibles(lotesRes || []);
        setCamposDisponibles(camposRes || []);
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

  const getLoteSeleccionado = () => {
    return lotesDisponibles.find(lote => lote.id === parseInt(formData.animal));
  };

  const getCamposDisponiblesParaDestino = () => {
    const loteSeleccionado = getLoteSeleccionado();
    if (!loteSeleccionado) return camposDisponibles;
    
    return camposDisponibles.filter(campo => 
      campo.id !== loteSeleccionado.campo_actual_obj?.id
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loteSeleccionado = getLoteSeleccionado();
      if (!loteSeleccionado) {
        throw new Error('Debe seleccionar un lote para transferir');
      }

      if (!formData.campo_destino) {
        throw new Error('Debe seleccionar un campo de destino');
      }

      if (loteSeleccionado.campo_actual_obj?.id === parseInt(formData.campo_destino)) {
        throw new Error('El lote ya se encuentra en ese campo');
      }

      // Crear transferencia usando el endpoint de transferencias
      const transferenciaData = {
        animal: loteSeleccionado.id,
        campo_origen: loteSeleccionado.campo_actual_obj?.id,
        campo_destino: parseInt(formData.campo_destino),
        fecha: formData.fecha,
        observaciones: formData.observaciones,
      };

      await transferenciasApi.create(transferenciaData);
      onSave();
      onClose();
    } catch (error) {
      setError(error.message || 'Error al transferir el lote');
    } finally {
      setLoading(false);
    }
  };

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
            <Grid item xs={12}>
              <Autocomplete
                options={lotesDisponibles || []}
                value={lotesDisponibles?.find(lote => lote.id === parseInt(formData.animal)) || null}
                getOptionLabel={(option) => {
                  if (!option) return '';
                  return `${option.lote_id} - ${option.raza} (${option.cantidad} animales) - Campo: ${option.campo}`;
                }}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                onChange={(event, newValue) => {
                  setFormData({ 
                    ...formData, 
                    animal: newValue?.id?.toString() || '',
                    campo_origen: newValue?.campo_actual_obj?.id?.toString() || '',
                    campo_destino: '' // Reset destino cuando cambia lote
                  });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    label="Lote a Transferir"
                    variant="outlined"
                    required
                    fullWidth
                    helperText="Seleccione el lote de animales que desea transferir"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={camposDestino || []}
                value={camposDestino?.find(campo => campo.id === parseInt(formData.campo_destino)) || null}
                getOptionLabel={(option) => option?.nombre || ''}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, campo_destino: newValue?.id?.toString() || '' });
                }}
                disabled={!formData.animal}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    label="Campo de Destino"
                    variant="outlined"
                    required
                    fullWidth
                    helperText="Seleccione el campo de destino para el lote"
                  />
                )}
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
            disabled={loading || !formData.animal || !formData.campo_destino}
            startIcon={loading ? <CircularProgress size={20} /> : <SwapHorizIcon />}
          >
            {loading ? 'Transfiriendo...' : 'Transferir Lote'}
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
        try {
          await loadTransferencias();
        } catch (reloadError) {
          console.error('Error al recargar datos:', reloadError);
          // No mostrar error por recarga, ya que la eliminación fue exitosa
        }
      } catch (error) {
        setError('Error al eliminar la transferencia');
      }
    }
  };

  const getTotalAnimalesTransferidos = () => {
    return transferencias.length; // Cada transferencia es un lote completo
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
                Lotes Transferidos
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
                  <TableCell>Lote</TableCell>
                  <TableCell>Campo Origen</TableCell>
                  <TableCell>Campo Destino</TableCell>
                  <TableCell>Observaciones</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transferencias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
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
                        <Chip label={transferencia.animal_lote_id || `ID: ${transferencia.animal}`} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{transferencia.campo_origen_nombre}</TableCell>
                      <TableCell>{transferencia.campo_destino_nombre}</TableCell>
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
