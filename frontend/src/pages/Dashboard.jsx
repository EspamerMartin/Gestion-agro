import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Agriculture as AgricultureIcon,
  Pets as PetsIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import DashboardLayout from '../layouts/DashboardLayout';
import { dashboardApi } from '../services/api';
import { CHART_COLORS } from '../constants';
import { formatNumber } from '../utils';

const StatCard = ({ title, value, icon, color = 'primary', subtitle }) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        background: `linear-gradient(135deg, ${theme.palette[color].main}15 0%, ${theme.palette[color].main}05 100%)`,
        borderLeft: `4px solid ${theme.palette[color].main}`,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
        },
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: `${color}.main`, mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: '12px',
              backgroundColor: `${color}.main`,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon, { sx: { fontSize: 28 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
          {label}
        </Typography>
        {payload.map((entry, index) => (
          <Typography key={index} variant="body2" sx={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timePeriod, setTimePeriod] = useState('30d');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  useEffect(() => {
    loadStats();
  }, [timePeriod]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getStats();
      setStats(response);
    } catch (err) {
      setError('Error al cargar estadísticas');
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </DashboardLayout>
    );
  }

  const pieChartColors = CHART_COLORS.pie;

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent, name
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // No mostrar labels para porcentajes muy pequeños

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={isDesktop ? 14 : 12}
        fontWeight="700"
        style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
        }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const renderOuterLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name, index }) => {
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 30;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={pieChartColors[index % pieChartColors.length]}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="600"
      >
        {`${name}: ${value}`}
      </text>
    );
  };

  return (
    <DashboardLayout>
      <Box sx={{ width: '100%', maxWidth: '100%' }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 4,
          gap: 2
        }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Vista general del sistema de gestión ganadera
            </Typography>
          </Box>
          
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={timePeriod}
              label="Período"
              onChange={(e) => setTimePeriod(e.target.value)}
            >
              <MenuItem value="7d">Últimos 7 días</MenuItem>
              <MenuItem value="30d">Últimos 30 días</MenuItem>
              <MenuItem value="90d">Últimos 3 meses</MenuItem>
              <MenuItem value="1y">Último año</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Total de Animales"
              value={formatNumber(stats?.total_animales || 0)}
              subtitle="En toda la operación"
              icon={<PetsIcon />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Campos Activos"
              value={formatNumber(stats?.animales_por_campo?.length || 0)}
              subtitle="En operación actual"
              icon={<AgricultureIcon />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Promedio Animales/Ha"
              value={stats?.lotes_por_campo?.length > 0 ? 
                `${(stats.lotes_por_campo.reduce((acc, campo) => acc + parseFloat(campo.animales_por_hectarea || 0), 0) / stats.lotes_por_campo.length).toFixed(2)}` 
                : '0'}
              subtitle="Animales por hectárea"
              icon={<TrendingUpIcon />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Registros Totales"
              value={formatNumber((stats?.total_animales || 0) + (stats?.animales_por_campo?.length || 0))}
              subtitle="En la base de datos"
              icon={<AssignmentIcon />}
              color="info"
            />
          </Grid>
        </Grid>

        {/* Charts - Solo gráfico de distribución por campo */}
        <Grid container spacing={4}>
          <Grid item xs={12}>
            <Paper sx={{ 
              p: 4, 
              borderRadius: 3, 
              height: isDesktop ? 520 : (isMobile ? 400 : 450),
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
              border: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}>
                Distribución de Animales por Campo
              </Typography>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart 
                  data={stats?.lotes_por_campo || []}
                  margin={{ 
                    top: 20, 
                    right: isDesktop ? 40 : 30, 
                    left: isDesktop ? 30 : 20, 
                    bottom: isMobile ? 80 : 60 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} opacity={0.5} />
                  <XAxis 
                    dataKey="campo" 
                    tick={{ fontSize: isDesktop ? 14 : 12, fontWeight: 500 }}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    height={isMobile ? 80 : 60}
                    stroke={theme.palette.text.secondary}
                  />
                  <YAxis tick={{ fontSize: isDesktop ? 14 : 12, fontWeight: 500 }} stroke={theme.palette.text.secondary} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="total_animales" 
                    fill={CHART_COLORS.primary}
                    radius={[6, 6, 0, 0]}
                    name="Total de Animales"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
};

export default Dashboard;
