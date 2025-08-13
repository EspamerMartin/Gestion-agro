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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Pets as PetsIcon,
} from '@mui/icons-material';
import DashboardLayout from '../layouts/DashboardLayout';
import { vacunosApi, opcionesApi } from '../services/api';
import { formatDate, calculateAge, formatDateForInput } from '../utils';
import { SEXO_CHOICES, CICLO_PRODUCTIVO_CHOICES, ESTADO_GENERAL_CHOICES } from '../constants';

const VacunoDialog = ({ open, onClose, vacuno, onSave }) => {
  const [formData, setFormData] = useState({
    lote_id: '',
    raza: '',
    cantidad: 1,
    sexo: '',
    fecha_nacimiento: '',
    fecha_ingreso: '',
    observaciones: '',
    // Campos adicionales para el estado y estadia (no van en el modelo Vacuno directamente)
    ciclo_productivo: '',
    campo: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [razasDisponibles, setRazasDisponibles] = useState([]);
  const [camposDisponibles, setCamposDisponibles] = useState([]);

  // Cargar opciones cuando se abre el diálogo
  useEffect(() => {
    const cargarOpciones = async () => {
      try {
        const [razasRes, camposRes] = await Promise.all([
          opcionesApi.getRazas(),
          opcionesApi.getCampos()
        ]);
        setRazasDisponibles(razasRes || []);
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
    if (vacuno) {
      setFormData({
        lote_id: vacuno.lote_id || '',
        raza: vacuno.raza || '',
        cantidad: vacuno.cantidad || 1,
        sexo: vacuno.sexo || '',
        fecha_nacimiento: formatDateForInput(vacuno.fecha_nacimiento) || '',
        fecha_ingreso: formatDateForInput(vacuno.fecha_ingreso) || '',
        observaciones: vacuno.observaciones || '',
        // Campos adicionales del estado actual
        ciclo_productivo: vacuno.estado_actual_obj?.ciclo_productivo || '',
        campo: vacuno.campo_actual_obj?.id || '',
      });
    } else {
      setFormData({
        lote_id: '',
        raza: '',
        cantidad: 1,
        sexo: '',
        fecha_nacimiento: '',
        fecha_ingreso: formatDateForInput(new Date()),
        observaciones: '',
        ciclo_productivo: '',
        campo: '',
      });
    }
    setError('');
  }, [vacuno, open]);

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
      // Datos básicos del vacuno (campos del modelo Vacuno)
      const vacunoData = {
        lote_id: formData.lote_id,
        raza: formData.raza,
        cantidad: parseInt(formData.cantidad),
        sexo: formData.sexo,
        fecha_nacimiento: formData.fecha_nacimiento || null,
        fecha_ingreso: formData.fecha_ingreso,
        observaciones: formData.observaciones,
      };

      if (vacuno) {
        await vacunosApi.update(vacuno.id, vacunoData);
      } else {
        await vacunosApi.create(vacunoData);
      }
      onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar el vacuno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {vacuno ? 'Editar Lote de Animales' : 'Cargar Lote de Animales'}
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
                    helperText="Seleccione la raza del ganado"
                  />
                )}
                freeSolo
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="lote_id"
                label="ID del Lote"
                type="text"
                fullWidth
                variant="outlined"
                value={formData.lote_id}
                onChange={handleChange}
                required
                helperText="Ingrese el identificador del lote (ej: LOTE-001)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="cantidad"
                label="Cantidad de Animales"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.cantidad}
                onChange={handleChange}
                required
                inputProps={{ min: 1, max: 1000 }}
                helperText="Cantidad de animales en este lote"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense" variant="outlined">
                <InputLabel>Sexo</InputLabel>
                <Select
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleChange}
                  label="Sexo"
                  required
                >
                  {SEXO_CHOICES.map((choice) => (
                    <MenuItem key={choice.value} value={choice.value}>
                      {choice.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense" variant="outlined">
                <InputLabel>Ciclo Productivo</InputLabel>
                <Select
                  name="ciclo_productivo"
                  value={formData.ciclo_productivo}
                  onChange={handleChange}
                  label="Ciclo Productivo"
                  required
                >
                  {CICLO_PRODUCTIVO_CHOICES.map((choice) => (
                    <MenuItem key={choice.value} value={choice.value}>
                      {choice.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Autocomplete
                options={(camposDisponibles || []).map(campo => campo.nombre)}
                value={formData.campo}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, campo: newValue || '' });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    label="Campo"
                    variant="outlined"
                    required
                    fullWidth
                    helperText="Seleccione el campo donde se ubicarán los animales"
                  />
                )}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="fecha_nacimiento"
                label="Fecha de Nacimiento (Aprox.)"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.fecha_nacimiento}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                helperText="Fecha aproximada para el lote"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="fecha_ingreso"
                label="Fecha de Ingreso"
                type="date"
                fullWidth
                variant="outlined"
                value={formData.fecha_ingreso}
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
                placeholder="Observaciones adicionales"
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

const DeleteVacunoDialog = ({ open, onClose, vacuno, onDelete }) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await vacunosApi.delete(vacuno.id);
      onDelete();
      onClose();
    } catch (err) {
      console.error('Error deleting vacuno:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Eliminar Vacuno</DialogTitle>
      <DialogContent>
        <Typography>
          ¿Está seguro que desea eliminar el lote de vacunos <strong>{vacuno?.raza}</strong> del campo <strong>{vacuno?.campo}</strong>?
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

const Vacunos = () => {
  const [vacunos, setVacunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVacuno, setSelectedVacuno] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVacunos();
  }, []);

  const loadVacunos = async () => {
    try {
      setLoading(true);
      const response = await vacunosApi.getAll();
      setVacunos(response || []);
    } catch (err) {
      setError('Error al cargar los vacunos');
      console.error('Error loading vacunos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVacuno = () => {
    setSelectedVacuno(null);
    setDialogOpen(true);
  };

  const handleEditVacuno = (vacuno) => {
    setSelectedVacuno(vacuno);
    setDialogOpen(true);
  };

  const handleDeleteVacuno = (vacuno) => {
    setSelectedVacuno(vacuno);
    setDeleteDialogOpen(true);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'activo': return 'success';
      case 'vendido': return 'primary';
      case 'muerto': return 'error';
      case 'transferido': return 'warning';
      default: return 'default';
    }
  };

  const getSexoIcon = (sexo) => {
    return sexo === 'M' ? '♂️' : '♀️';
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
            <PetsIcon sx={{ mr: 1, color: 'primary.main', fontSize: 28 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              Gestión de Lotes de Animales
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddVacuno}
          >
            Cargar Lote de Animales
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
                {vacunos?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total de Lotes
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {vacunos.filter(v => v.estado_actual === 'activo').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Activos
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                {vacunos.filter(v => v.sexo === 'M').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Machos
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="secondary.main" sx={{ fontWeight: 600 }}>
                {vacunos.filter(v => v.sexo === 'H').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hembras
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
                  <TableCell>Lote</TableCell>
                  <TableCell>Raza</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Sexo</TableCell>
                  <TableCell>Ciclo</TableCell>
                  <TableCell>Campo</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vacunos.map((vacuno) => (
                  <TableRow key={vacuno.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PetsIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {vacuno.lote_id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Ingreso: {formatDate(vacuno.fecha_ingreso)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{vacuno.raza}</TableCell>
                    <TableCell>
                      <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        {vacuno.cantidad || 1} animales
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 4 }}>{getSexoIcon(vacuno.sexo)}</span>
                        {SEXO_CHOICES.find(s => s.value === vacuno.sexo)?.label}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {vacuno.ciclo_productivo ? 
                        CICLO_PRODUCTIVO_CHOICES.find(c => c.value === vacuno.ciclo_productivo)?.label 
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {vacuno.campo || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={ESTADO_GENERAL_CHOICES.find(e => e.value === vacuno.estado_actual)?.label || 'Activo'}
                        color={getEstadoColor(vacuno.estado_actual)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => handleEditVacuno(vacuno)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteVacuno(vacuno)}
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

          {vacunos.length === 0 && !loading && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <PetsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No hay lotes de animales registrados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cargue el primer lote para comenzar la gestión
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Dialogs */}
        <VacunoDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          vacuno={selectedVacuno}
          onSave={loadVacunos}
        />

        <DeleteVacunoDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          vacuno={selectedVacuno}
          onDelete={loadVacunos}
        />
      </Box>
    </DashboardLayout>
  );
};

export default Vacunos;
