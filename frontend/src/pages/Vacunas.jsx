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
  Tooltip,
  Grid,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Vaccines as VaccinesIcon,
} from '@mui/icons-material';
import DashboardLayout from '../layouts/DashboardLayout';
import { vacunasApi, opcionesApi } from '../services/api';

const VacunaDialog = ({ open, onClose, vacuna, onSave }) => {
  const [formData, setFormData] = useState({
    campo: '',
    tipo_vacuna: '',
    fecha_aplicacion: '',
    veterinario: '',
    observaciones: '',
    cantidad_animales: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vacunasDisponibles, setVacunasDisponibles] = useState([]);
  const [camposDisponibles, setCamposDisponibles] = useState([]);

  // Cargar opciones cuando se abre el diálogo
  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        const [vacunasRes, camposRes] = await Promise.all([
          opcionesApi.getVacunas(),
          opcionesApi.getCampos()
        ]);
        setVacunasDisponibles(vacunasRes.data);
        setCamposDisponibles(camposRes.data);
      } catch (error) {
        console.error('Error cargando opciones:', error);
      }
    };

    if (open) {
      cargarOpciones();
    }
  }, [open]);

  useEffect(() => {
    if (vacuna) {
      setFormData({
        campo: vacuna.campo || '',
        tipo_vacuna: vacuna.tipo_vacuna || '',
        fecha_aplicacion: vacuna.fecha_aplicacion || new Date().toISOString().split('T')[0],
        veterinario: vacuna.veterinario || '',
        observaciones: vacuna.observaciones || '',
        cantidad_animales: vacuna.cantidad_animales || '',
      });
    } else {
      setFormData({
        campo: '',
        tipo_vacuna: '',
        fecha_aplicacion: new Date().toISOString().split('T')[0],
        veterinario: '',
        observaciones: '',
        cantidad_animales: '',
      });
    }
    setError('');
  }, [vacuna, open]);

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
      if (vacuna) {
        await vacunasApi.update(vacuna.id, formData);
      } else {
        await vacunasApi.create(formData);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar la vacuna');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {vacuna ? 'Editar Vacunación' : 'Registrar Vacunación de Campo'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={camposDisponibles.map(campo => campo.nombre)}
                value={formData.campo}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, campo: newValue || '' });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    autoFocus
                    margin="dense"
                    label="Campo"
                    variant="outlined"
                    required
                    fullWidth
                    helperText="Campo donde se aplicará la vacuna"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={vacunasDisponibles}
                value={formData.tipo_vacuna}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, tipo_vacuna: newValue || '' });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    label="Tipo de Vacuna"
                    variant="outlined"
                    required
                    fullWidth
                    helperText="Seleccione el tipo de vacuna a aplicar"
                  />
                )}
                freeSolo
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="fecha_aplicacion"
                label="Fecha de Aplicación"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.fecha_aplicacion}
                onChange={handleChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="cantidad_animales"
                label="Cantidad de Animales"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.cantidad_animales}
                onChange={handleChange}
                required
                inputProps={{ min: 1 }}
                placeholder="Número de animales vacunados"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="veterinario"
                label="Veterinario"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.veterinario}
                onChange={handleChange}
                placeholder="Nombre del veterinario responsable"
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
                placeholder="Observaciones sobre la vacunación, reacciones, etc."
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

const DeleteVacunaDialog = ({ open, onClose, vacuna, onDelete }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await vacunasApi.delete(vacuna.id);
      onDelete();
      onClose();
    } catch (err) {
      console.error('Error deleting vacuna:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Eliminar Vacuna</DialogTitle>
      <DialogContent>
        <Typography>
          ¿Está seguro que desea eliminar la vacuna <strong>{vacuna?.nombre}</strong>?
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

const Vacunas = () => {
  const [vacunas, setVacunas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVacuna, setSelectedVacuna] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVacunas();
  }, []);

  const loadVacunas = async () => {
    try {
      setLoading(true);
      const response = await vacunasApi.getAll();
      setVacunas(response.data);
    } catch (err) {
      setError('Error al cargar las vacunas');
      console.error('Error loading vacunas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVacuna = () => {
    setSelectedVacuna(null);
    setDialogOpen(true);
  };

  const handleEditVacuna = (vacuna) => {
    setSelectedVacuna(vacuna);
    setDialogOpen(true);
  };

  const handleDeleteVacuna = (vacuna) => {
    setSelectedVacuna(vacuna);
    setDeleteDialogOpen(true);
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
            <VaccinesIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Control de Vacunaciones por Campo
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddVacuna}
          >
            Registrar Vacunación
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
                {vacunas.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vacunaciones Realizadas
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {vacunas.filter(v => v.laboratorio).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Con Laboratorio
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                {vacunas.filter(v => v.descripcion).length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Con Descripción
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
                  <TableCell>Campo</TableCell>
                  <TableCell>Tipo de Vacuna</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Animales</TableCell>
                  <TableCell>Veterinario</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vacunas.map((vacuna) => (
                  <TableRow key={vacuna.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <VaccinesIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {vacuna.campo || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {vacuna.tipo_vacuna || vacuna.nombre || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {vacuna.fecha_aplicacion || '-'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        {vacuna.cantidad_animales || 'N/A'} animales
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {vacuna.veterinario || '-'}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEditVacuna(vacuna)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteVacuna(vacuna)}
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

          {vacunas.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <VaccinesIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No hay vacunaciones registradas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Registre la primera vacunación de campo para comenzar
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Dialogs */}
        <VacunaDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          vacuna={selectedVacuna}
          onSave={loadVacunas}
        />

        <DeleteVacunaDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          vacuna={selectedVacuna}
          onDelete={loadVacunas}
        />
      </Box>
    </DashboardLayout>
  );
};

export default Vacunas;
