from datetime import timedelta
from decimal import Decimal

from django.db.models import Avg, Sum
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Campo,
    EstadiaAnimal,
    EstadoVacuno,
    PrecioMercado,
    Transferencia,
    Vacuna,
    Vacunacion,
    Vacuno,
    Venta,
)
from .serializers import (
    CampoSerializer,
    DashboardStatsSerializer,
    EstadiaAnimalSerializer,
    EstadoVacunoSerializer,
    OpcionesSerializer,
    PrecioMercadoSerializer,
    TransferenciaSerializer,
    VacunacionSerializer,
    VacunaSerializer,
    VacunoSerializer,
    VentaSerializer,
)


class CampoViewSet(viewsets.ModelViewSet):
    queryset = Campo.objects.all()
    serializer_class = CampoSerializer

class VacunoViewSet(viewsets.ModelViewSet):
    queryset = Vacuno.objects.all()
    serializer_class = VacunoSerializer

    def get_queryset(self):
        queryset = Vacuno.objects.all()
        campo_id = self.request.query_params.get('campo', None)
        raza = self.request.query_params.get('raza', None)
        
        if campo_id is not None:
            # Filtrar por campo actual
            queryset = queryset.filter(
                estadias__campo_id=campo_id,
                estadias__fecha_salida__isnull=True
            )
            
        if raza is not None:
            queryset = queryset.filter(raza__icontains=raza)
            
        return queryset

class EstadoVacunoViewSet(viewsets.ModelViewSet):
    queryset = EstadoVacuno.objects.all()
    serializer_class = EstadoVacunoSerializer

class EstadiaAnimalViewSet(viewsets.ModelViewSet):
    queryset = EstadiaAnimal.objects.all()
    serializer_class = EstadiaAnimalSerializer

class VacunaViewSet(viewsets.ModelViewSet):
    queryset = Vacuna.objects.all()
    serializer_class = VacunaSerializer

class VacunacionViewSet(viewsets.ModelViewSet):
    queryset = Vacunacion.objects.all()
    serializer_class = VacunacionSerializer

    def get_queryset(self):
        queryset = Vacunacion.objects.all()
        animal_id = self.request.query_params.get('animal', None)
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        
        if animal_id is not None:
            queryset = queryset.filter(animal_id=animal_id)
            
        if fecha_desde:
            queryset = queryset.filter(fecha__gte=fecha_desde)
            
        if fecha_hasta:
            queryset = queryset.filter(fecha__lte=fecha_hasta)
            
        return queryset.order_by('-fecha')

class TransferenciaViewSet(viewsets.ModelViewSet):
    queryset = Transferencia.objects.all()
    serializer_class = TransferenciaSerializer

    def get_queryset(self):
        queryset = Transferencia.objects.all()
        campo_origen = self.request.query_params.get('campo_origen', None)
        campo_destino = self.request.query_params.get('campo_destino', None)
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        
        if campo_origen is not None:
            queryset = queryset.filter(campo_origen_id=campo_origen)
            
        if campo_destino is not None:
            queryset = queryset.filter(campo_destino_id=campo_destino)
            
        if fecha_desde:
            queryset = queryset.filter(fecha__gte=fecha_desde)
            
        if fecha_hasta:
            queryset = queryset.filter(fecha__lte=fecha_hasta)
            
        return queryset.order_by('-fecha')

    def perform_create(self, serializer):
        transferencia = serializer.save()
        
        # Actualizar estadia del animal
        # Cerrar estadia anterior
        EstadiaAnimal.objects.filter(
            animal=transferencia.animal,
            fecha_salida__isnull=True
        ).update(fecha_salida=transferencia.fecha)
        
        # Crear nueva estadia
        EstadiaAnimal.objects.create(
            animal=transferencia.animal,
            campo=transferencia.campo_destino,
            fecha_entrada=transferencia.fecha
        )
        
        # Crear estado de transferido
        EstadoVacuno.objects.create(
            vacuno=transferencia.animal,
            estado_general='transferido',
            observaciones=f"Transferido de {transferencia.campo_origen} a {transferencia.campo_destino}"
        )

class VentaViewSet(viewsets.ModelViewSet):
    queryset = Venta.objects.all()
    serializer_class = VentaSerializer

    def get_queryset(self):
        queryset = Venta.objects.all()
        fecha_desde = self.request.query_params.get('fecha_desde', None)
        fecha_hasta = self.request.query_params.get('fecha_hasta', None)
        comprador = self.request.query_params.get('comprador', None)
        
        if fecha_desde:
            queryset = queryset.filter(fecha__gte=fecha_desde)
            
        if fecha_hasta:
            queryset = queryset.filter(fecha__lte=fecha_hasta)
            
        if comprador:
            queryset = queryset.filter(comprador__icontains=comprador)
            
        return queryset.order_by('-fecha')

    def perform_create(self, serializer):
        venta = serializer.save()
        
        # Marcar animal como vendido
        EstadoVacuno.objects.create(
            vacuno=venta.animal,
            estado_general='vendido',
            observaciones=f"Vendido a {venta.comprador} por ${venta.precio}"
        )
        
        # Cerrar estadia actual
        EstadiaAnimal.objects.filter(
            animal=venta.animal,
            fecha_salida__isnull=True
        ).update(fecha_salida=venta.fecha)

class PrecioMercadoViewSet(viewsets.ModelViewSet):
    queryset = PrecioMercado.objects.all()
    serializer_class = PrecioMercadoSerializer

class DashboardViewSet(viewsets.ViewSet):
    """
    ViewSet para estadísticas del dashboard
    """
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Endpoint unificado para todas las estadísticas del dashboard"""
        
        # Fecha actual y rangos
        hoy = timezone.now().date()
        inicio_mes = hoy.replace(day=1)
        
        # Estadísticas básicas
        total_campos = Campo.objects.count()
        total_vacunos = Vacuno.objects.count()
        
        # Vacunos vendidos
        vacunos_vendidos = Vacuno.objects.filter(
            historial_estados__estado_general='vendido'
        ).distinct().count()
        
        # Ventas del mes actual
        ventas_mes = Venta.objects.filter(
            fecha__gte=inicio_mes
        ).aggregate(total=Sum('precio'))['total'] or Decimal('0')
        
        # Transferencias del mes actual
        transferencias_mes = Transferencia.objects.filter(
            fecha__gte=inicio_mes
        ).count()
        
        # Vacunaciones del mes actual
        vacunaciones_mes = Vacunacion.objects.filter(
            fecha__gte=inicio_mes
        ).count()
        
        # Promedio de vacunos por campo
        promedio_vacunos = total_vacunos / total_campos if total_campos > 0 else 0
        
        # Valor total estimado (precio promedio * vacunos activos)
        precio_promedio = PrecioMercado.objects.filter(
            fecha__gte=hoy - timedelta(days=30)
        ).aggregate(promedio=Avg('precio'))['promedio'] or Decimal('150000')
        
        vacunos_activos = Vacuno.objects.exclude(
            historial_estados__estado_general='vendido'
        ).distinct().count()
        
        valor_total_estimado = precio_promedio * vacunos_activos
        
        # Datos adicionales para el dashboard
        # Animales por campo
        animales_por_campo = []
        for campo in Campo.objects.all():
            animales_por_campo.append({
                'campo': campo.nombre,
                'animales': campo.capacidad_actual(),
                'hectareas': float(campo.hectareas or 0),
            })
        
        # Animales por ciclo productivo
        from django.db.models import Count
        ciclos_data = EstadoVacuno.objects.values('ciclo_productivo').annotate(
            count=Count('vacuno', distinct=True)
        ).filter(ciclo_productivo__isnull=False)
        
        animales_por_ciclo = []
        for ciclo in ciclos_data:
            if ciclo['ciclo_productivo']:
                animales_por_ciclo.append({
                    'ciclo': ciclo['ciclo_productivo'],
                    'value': ciclo['count'],
                })
        
        # Capacidad de campos
        capacidad_campos = []
        for campo in Campo.objects.all():
            capacidad_utilizada = campo.capacidad_actual()
            capacidad_maxima = int(campo.hectareas or 0) * 2  # Asumiendo 2 animales por hectárea como máximo
            capacidad_porcentaje = (capacidad_utilizada / capacidad_maxima * 100) if capacidad_maxima > 0 else 0
            
            capacidad_campos.append({
                'campo': campo.nombre,
                'capacidad_usada': round(capacidad_porcentaje, 1),
                'animales_actuales': capacidad_utilizada,
                'capacidad_maxima': capacidad_maxima,
            })
        
        stats_data = {
            'total_campos': total_campos,
            'total_vacunos': total_vacunos,
            'total_animales': total_vacunos,  # Alias para compatibilidad frontend
            'vacunos_vendidos': vacunos_vendidos,
            'ventas_mes_actual': ventas_mes,
            'transferencias_mes_actual': transferencias_mes,
            'vacunaciones_mes_actual': vacunaciones_mes,
            'promedio_vacunos_por_campo': round(promedio_vacunos, 1),
            'valor_total_estimado': valor_total_estimado,
            'animales_por_campo': animales_por_campo,
            'animales_por_ciclo': animales_por_ciclo,
            'capacidad_campos': capacidad_campos,
        }
        
        serializer = DashboardStatsSerializer(stats_data)
        return Response(serializer.data)

class OpcionesViewSet(viewsets.ViewSet):
    """
    ViewSet para opciones y datos de formularios
    """
    
    @action(detail=False, methods=['get'])
    def all(self, request):
        """Endpoint para obtener todas las opciones necesarias para los formularios"""
        
        # Campos disponibles
        campos = Campo.objects.all()
        
        # Vacunas disponibles
        vacunas = Vacuna.objects.all()
        
        # Razas disponibles (hardcodeadas como en el frontend)
        razas_disponibles = [
            "Aberdeen Angus", "Hereford", "Shorthorn", "Brahman", "Brangus",
            "Santa Gertrudis", "Limousin", "Charolais", "Simmental", "Criollo"
        ]
        
        # Opciones de choices de los modelos
        sexos_disponibles = [
            {"value": "M", "label": "Macho"},
            {"value": "H", "label": "Hembra"}
        ]
        
        ciclos_productivos = [
            {"value": "ternero", "label": "Ternero"},
            {"value": "novillo", "label": "Novillo"},
            {"value": "toro", "label": "Toro"},
            {"value": "ternera", "label": "Ternera"},
            {"value": "vaquillona", "label": "Vaquillona"},
            {"value": "vaca", "label": "Vaca"}
        ]
        
        estados_salud = [
            {"value": "sano", "label": "Sano"},
            {"value": "brucelosis", "label": "Brucelosis"},
            {"value": "tuberculosis", "label": "Tuberculosis"},
            {"value": "otra", "label": "Otra"}
        ]
        
        estados_generales = [
            {"value": "activo", "label": "Activo"},
            {"value": "vendido", "label": "Vendido"},
            {"value": "muerto", "label": "Muerto"},
            {"value": "transferido", "label": "Transferido"}
        ]
        
        opciones_data = {
            'campos': campos,
            'vacunas': vacunas,
            'razas_disponibles': razas_disponibles,
            'sexos_disponibles': sexos_disponibles,
            'ciclos_productivos': ciclos_productivos,
            'estados_salud': estados_salud,
            'estados_generales': estados_generales
        }
        
        serializer = OpcionesSerializer(opciones_data)
        return Response(serializer.data)
