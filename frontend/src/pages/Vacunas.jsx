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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Vaccines as VaccinesIcon,
} from '@mui/icons-material';
import DashboardLayout from '../layouts/DashboardLayout';
import { vacunasApi } from '../services/api';

const VacunaDialog = ({ open, onClose, vacuna, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    laboratorio: '',
    descripcion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vacuna) {
      setFormData({
        nombre: vacuna.nombre || '',
        laboratorio: vacuna.laboratorio || '',
        descripcion: vacuna.descripcion || '',
      });
    } else {
      setFormData({
        nombre: '',
        laboratorio: '',
        descripcion: '',
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
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                name="nombre"
                label="Nombre de la Vacuna"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.nombre}
                onChange={handleChange}
                required
                helperText="Nombre de la vacuna (ej: Aftosa, Brucelosis, etc.)"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                margin="dense"
                name="laboratorio"
                label="Laboratorio"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.laboratorio}
                onChange={handleChange}
                helperText="Laboratorio fabricante (opcional)"
              />
            </Grid>
            
            <Grid item xs={12}>
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
                helperText="Descripción de la vacuna, indicaciones, etc."
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
  const [error, setError] = useState('');

  // Limpiar error cuando se abre/cierra el diálogo
  useEffect(() => {
    if (open) {
      setError('');
    }
  }, [open]);

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await vacunasApi.delete(vacuna.id);
      onClose(); // Cerrar diálogo primero
      try {
        await onDelete(); // Luego recargar datos
      } catch (reloadError) {
        console.error('Error al recargar datos:', reloadError);
        // No mostrar error por recarga, ya que la eliminación fue exitosa
      }
    } catch (err) {
      console.error('Error deleting vacuna:', err);
      setError(err.message || 'Error al eliminar la vacuna');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Eliminar Vacuna</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
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
      setVacunas(response || []);
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
                  <TableCell>Nombre</TableCell>
                  <TableCell>Laboratorio</TableCell>
                  <TableCell>Descripción</TableCell>
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
                          {vacuna.nombre || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1">
                        {vacuna.laboratorio || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {vacuna.descripcion ? 
                          (vacuna.descripcion.length > 50 
                            ? `${vacuna.descripcion.substring(0, 50)}...` 
                            : vacuna.descripcion) 
                          : '-'
                        }
                      </Typography>
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
