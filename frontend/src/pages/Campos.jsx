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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Agriculture as AgricultureIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import DashboardLayout from '../layouts/DashboardLayout';
import { camposApi } from '../services/api';
import { formatNumber } from '../utils';

const CampoDialog = ({ open, onClose, campo, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    ubicacion: '',
    hectareas: '',
    descripcion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (campo) {
      setFormData({
        nombre: campo.nombre || '',
        ubicacion: campo.ubicacion || '',
        hectareas: campo.hectareas || '',
        descripcion: campo.descripcion || '',
      });
    } else {
      setFormData({
        nombre: '',
        ubicacion: '',
        hectareas: '',
        descripcion: '',
      });
    }
    setError('');
  }, [campo, open]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (campo) {
        await camposApi.update(campo.id, formData);
      } else {
        await camposApi.create(formData);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el campo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {campo ? 'Editar Campo' : 'Nuevo Campo'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            name="nombre"
            label="Nombre del Campo"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.nombre}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="ubicacion"
            label="Ubicación"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.ubicacion}
            onChange={handleChange}
            required
            placeholder="ej: La Pampa RN9 KM70"
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="hectareas"
            label="Hectáreas"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.hectareas}
            onChange={handleChange}
            inputProps={{ step: '1', min: '1', pattern: '[0-9]*' }}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            name="descripcion"
            label="Descripción"
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            value={formData.descripcion}
            onChange={handleChange}
            placeholder="Descripción opcional del campo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const DeleteCampoDialog = ({ open, onClose, campo, onDelete }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      console.log('Eliminando campo con ID:', campo.id);
      await camposApi.delete(campo.id);
      console.log('Campo eliminado exitosamente');
      onClose();
      // Forzar refresh inmediato
      await onDelete();
    } catch (err) {
      console.error('Error deleting campo:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Eliminar Campo</DialogTitle>
      <DialogContent>
        <Typography>
          ¿Está seguro que desea eliminar el campo <strong>{campo?.nombre}</strong>?
          Esta acción no se puede deshacer.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleDelete}
          color="error"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Eliminando...' : 'Eliminar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Campos = () => {
  const [campos, setCampos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCampo, setSelectedCampo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCampos();
  }, []);

  const loadCampos = async () => {
    try {
      console.log('Cargando campos...');
      setLoading(true);
      const response = await camposApi.getAll();
      console.log('Campos cargados:', response);
      setCampos(response || []);
    } catch (err) {
      setError('Error al cargar los campos');
      console.error('Error loading campos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCampo = () => {
    setSelectedCampo(null);
    setDialogOpen(true);
  };

  const handleEditCampo = (campo) => {
    setSelectedCampo(campo);
    setDialogOpen(true);
  };

  const handleDeleteCampo = (campo) => {
    setSelectedCampo(campo);
    setDeleteDialogOpen(true);
  };

  const getEstadoOcupacionColor = (estadoOcupacion) => {
    switch (estadoOcupacion) {
      case 'baja':
        return 'success'; // Verde para baja ocupación
      case 'media':
        return 'warning'; // Amarillo para media ocupación
      case 'alta':
        return 'error'; // Rojo para alta ocupación
      default:
        return 'default';
    }
  };

  const getEstadoOcupacionLabel = (estadoOcupacion) => {
    switch (estadoOcupacion) {
      case 'baja':
        return 'Baja ocupación';
      case 'media':
        return 'Media ocupación';
      case 'alta':
        return 'Alta ocupación';
      default:
        return 'Sin datos';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AgricultureIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Gestión de Campos
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCampo}
          >
            Nuevo Campo
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
                {campos.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Campos Totales
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {formatNumber(campos.reduce((sum, campo) => sum + (parseFloat(campo.hectareas) || 0), 0), 1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hectáreas Totales
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                {campos.reduce((sum, campo) => sum + (campo.total_animales || 0), 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Animales Totales
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Table */}
        <Paper sx={{ borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Ubicación</TableCell>
                  <TableCell align="right">Hectáreas</TableCell>
                  <TableCell align="right">Lotes</TableCell>
                  <TableCell align="right">Total Animales</TableCell>
                  <TableCell align="right">Animales/Ha</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {campos.map((campo) => (
                  <TableRow key={campo.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AgricultureIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {campo.nombre}
                          </Typography>
                          {campo.descripcion && (
                            <Typography variant="caption" color="text.secondary">
                              {campo.descripcion}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{campo.ubicacion}</TableCell>
                    <TableCell align="right">
                      {campo.hectareas ? formatNumber(campo.hectareas, 2) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {campo.capacidad_actual || 0}
                    </TableCell>
                    <TableCell align="right">
                      {campo.total_animales || 0}
                    </TableCell>
                    <TableCell align="right">
                      {campo.animales_por_hectarea || 0}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={`Densidad: ${campo.animales_por_hectarea || 0} animales/ha`}>
                        <Chip
                          size="small"
                          label={getEstadoOcupacionLabel(campo.estado_ocupacion)}
                          color={getEstadoOcupacionColor(campo.estado_ocupacion)}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEditCampo(campo)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteCampo(campo)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {campos.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <AgricultureIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No hay campos registrados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Agregue el primer campo para comenzar
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Dialogs */}
        <CampoDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          campo={selectedCampo}
          onSave={loadCampos}
        />

        <DeleteCampoDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          campo={selectedCampo}
          onDelete={loadCampos}
        />
      </Box>
    </DashboardLayout>
  );
};

export default Campos;
