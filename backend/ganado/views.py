from datetime import timedelta
from decimal import Decimal

from django.db.models import Avg, Sum
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Campo,
    EstadiaAnimal,
    EstadoVacuno,
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
    TransferenciaSerializer,
    UserRegistrationSerializer,
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
    
    def perform_create(self, serializer):
        # Guardar el vacuno primero
        vacuno = serializer.save()
        
        # Si se proporciona un campo_inicial, crear la estadia
        campo_inicial_id = self.request.data.get('campo_inicial')
        if campo_inicial_id:
            try:
                from .models import EstadiaAnimal
                campo = Campo.objects.get(id=campo_inicial_id)
                EstadiaAnimal.objects.create(
                    animal=vacuno,
                    campo=campo,
                    fecha_entrada=vacuno.fecha_ingreso,
                    observaciones=f"Ingreso inicial al campo {campo.nombre}"
                )
            except Campo.DoesNotExist:
                pass  # Si el campo no existe, continuar sin crear la estadia
        
        # Crear estado inicial del vacuno
        from .models import EstadoVacuno
        EstadoVacuno.objects.create(
            vacuno=vacuno,
            ciclo_productivo='ternero',  # Estado inicial por defecto
            estado_salud='sano',
            estado_general='activo'
        )
    
    def perform_update(self, serializer):
        # Solo actualizar los datos básicos del vacuno
        # No manejar cambios de campo aquí - eso se hace a través de transferencias
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def cambiar_campo(self, request, pk=None):
        """Endpoint para cambiar el campo de un vacuno mediante transferencia"""
        vacuno = self.get_object()
        nuevo_campo_id = request.data.get('campo_id')
        
        if not nuevo_campo_id:
            return Response({'error': 'campo_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .models import EstadiaAnimal, Transferencia
            from datetime import date
            
            nuevo_campo = Campo.objects.get(id=nuevo_campo_id)
            campo_actual = vacuno.campo_actual()
            
            if campo_actual and campo_actual.id == nuevo_campo.id:
                return Response({'message': 'El vacuno ya está en ese campo'}, status=status.HTTP_200_OK)
            
            # Cerrar estadia actual si existe
            if campo_actual:
                estadia_actual = vacuno.estadias.filter(fecha_salida__isnull=True).first()
                if estadia_actual:
                    estadia_actual.fecha_salida = date.today()
                    estadia_actual.save()
                
                # Crear transferencia
                Transferencia.objects.create(
                    animal=vacuno,
                    campo_origen=campo_actual,
                    campo_destino=nuevo_campo,
                    fecha=date.today(),
                    observaciones=f"Transferencia automática via interfaz"
                )
            
            # Crear nueva estadia
            EstadiaAnimal.objects.create(
                animal=vacuno,
                campo=nuevo_campo,
                fecha_entrada=date.today(),
                observaciones=f"Transferido desde {campo_actual.nombre if campo_actual else 'sin campo'}"
            )
            
            return Response({'message': 'Campo actualizado exitosamente'}, status=status.HTTP_200_OK)
            
        except Campo.DoesNotExist:
            return Response({'error': 'Campo no encontrado'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        total_lotes = Vacuno.objects.count()  # Cada vacuno representa un lote
        
        # Lotes vendidos
        lotes_vendidos = Vacuno.objects.filter(
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
        
        # Promedio de lotes por campo
        promedio_lotes_por_campo = total_lotes / total_campos if total_campos > 0 else 0
        
        # Datos adicionales para el dashboard
        # Lotes por campo y animales por hectárea
        lotes_por_campo = []
        for campo in Campo.objects.all():
            total_animales = sum([vacuno.cantidad for vacuno in campo.vacunos_actuales()])
            total_lotes = campo.capacidad_actual()
            animales_por_hectarea = total_animales / float(campo.hectareas) if campo.hectareas and campo.hectareas > 0 else 0
            
            lotes_por_campo.append({
                'campo': campo.nombre,
                'lotes': total_lotes,
                'total_animales': total_animales,
                'hectareas': float(campo.hectareas or 0),
                'animales_por_hectarea': round(animales_por_hectarea, 2),
            })
        
        # Lotes por ciclo productivo
        from django.db.models import Count
        ciclos_data = EstadoVacuno.objects.values('ciclo_productivo').annotate(
            count=Count('vacuno', distinct=True)
        ).filter(ciclo_productivo__isnull=False)
        
        lotes_por_ciclo = []
        for ciclo in ciclos_data:
            if ciclo['ciclo_productivo']:
                lotes_por_ciclo.append({
                    'ciclo': ciclo['ciclo_productivo'],
                    'value': ciclo['count'],
                })
        
        # Densidad de animales por campo
        densidad_campos = []
        for campo in Campo.objects.all():
            total_animales = sum([vacuno.cantidad for vacuno in campo.vacunos_actuales()])
            animales_por_hectarea = total_animales / float(campo.hectareas) if campo.hectareas and campo.hectareas > 0 else 0
            densidad_recomendada = 2.0  # animales por hectárea recomendado
            porcentaje_densidad = (animales_por_hectarea / densidad_recomendada * 100) if densidad_recomendada > 0 else 0
            
            densidad_campos.append({
                'campo': campo.nombre,
                'densidad_actual': round(animales_por_hectarea, 2),
                'densidad_porcentaje': round(porcentaje_densidad, 1),
                'total_animales': total_animales,
                'hectareas': float(campo.hectareas or 0),
            })
        
        stats_data = {
            'total_campos': total_campos,
            'total_vacunos': total_lotes,  # Para compatibilidad frontend
            'total_animales': total_lotes,  # Para compatibilidad frontend
            'total_lotes': total_lotes,
            'vacunos_vendidos': lotes_vendidos,
            'lotes_vendidos': lotes_vendidos,
            'ventas_mes_actual': ventas_mes,
            'transferencias_mes_actual': transferencias_mes,
            'vacunaciones_mes_actual': vacunaciones_mes,
            'promedio_vacunos_por_campo': round(promedio_lotes_por_campo, 1),
            'promedio_lotes_por_campo': round(promedio_lotes_por_campo, 1),
            'animales_por_campo': lotes_por_campo,  # Actualizado con nueva estructura
            'lotes_por_campo': lotes_por_campo,
            'animales_por_ciclo': lotes_por_ciclo,  # Para compatibilidad
            'lotes_por_ciclo': lotes_por_ciclo,
            'capacidad_campos': densidad_campos,  # Actualizado con densidad
            'densidad_campos': densidad_campos,
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


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Mapear los campos del frontend a los campos del modelo User
        data = {
            'username': request.data.get('email'),  # Usar email como username
            'email': request.data.get('email'),
            'first_name': request.data.get('name', '').split(' ')[0] if request.data.get('name') else '',
            'last_name': ' '.join(request.data.get('name', '').split(' ')[1:]) if request.data.get('name') and len(request.data.get('name').split(' ')) > 1 else '',
            'password': request.data.get('password'),
            'confirm_password': request.data.get('password')  # No se envía confirm_password desde el frontend
        }
        
        serializer = UserRegistrationSerializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Usuario registrado exitosamente',
                'user_id': user.id,
                'username': user.username,
                'email': user.email,
                'name': f"{user.first_name} {user.last_name}".strip()
            }, status=status.HTTP_201_CREATED)
        
        # Formatear errores para que sean más legibles en el frontend
        formatted_errors = {}
        for field, errors in serializer.errors.items():
            if field == 'email':
                formatted_errors['email'] = errors[0] if errors else 'Email inválido'
            elif field == 'username':
                formatted_errors['email'] = errors[0] if errors else 'Email ya está en uso'
            elif field == 'password':
                formatted_errors['password'] = errors[0] if errors else 'Contraseña inválida'
            elif field == 'first_name':
                formatted_errors['name'] = errors[0] if errors else 'Nombre es requerido'
            else:
                formatted_errors[field] = errors[0] if errors else f'Error en {field}'
        
        return Response({
            'message': 'Error en los datos proporcionados',
            'errors': formatted_errors
        }, status=status.HTTP_400_BAD_REQUEST)
