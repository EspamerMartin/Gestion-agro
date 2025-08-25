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
    serializer_class = CampoSerializer

    def get_queryset(self):
        """Filtrar campos por usuario autenticado"""
        return Campo.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        """Asignar el usuario actual al crear un campo"""
        serializer.save(usuario=self.request.user)

class VacunoViewSet(viewsets.ModelViewSet):
    serializer_class = VacunoSerializer

    def get_queryset(self):
        """Filtrar vacunos por usuario autenticado"""
        queryset = Vacuno.objects.filter(usuario=self.request.user)
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
        # Guardar el vacuno con el usuario actual
        # La lógica del campo_inicial y estado inicial se maneja en el serializer
        serializer.save(usuario=self.request.user)
    
    def perform_update(self, serializer):
        # Solo actualizar los datos básicos del vacuno
        # No manejar cambios de campo aquí - eso se hace a través de transferencias
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def cambiar_campo(self, request, pk=None):
        """Endpoint para cambiar el campo de un vacuno mediante transferencia"""
        vacuno = self.get_object()
        
        # Validar que el vacuno pertenece al usuario
        if vacuno.usuario != request.user:
            return Response({'error': 'No tienes permiso para modificar este vacuno'}, status=status.HTTP_403_FORBIDDEN)
            
        nuevo_campo_id = request.data.get('campo_id')
        
        if not nuevo_campo_id:
            return Response({'error': 'campo_id es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from .models import EstadiaAnimal, Transferencia
            from datetime import date
            
            nuevo_campo = Campo.objects.get(id=nuevo_campo_id, usuario=request.user)
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
    serializer_class = EstadoVacunoSerializer

    def get_queryset(self):
        """Filtrar estados por vacunos del usuario autenticado"""
        return EstadoVacuno.objects.filter(vacuno__usuario=self.request.user)

class EstadiaAnimalViewSet(viewsets.ModelViewSet):
    serializer_class = EstadiaAnimalSerializer

    def get_queryset(self):
        """Filtrar estadias por animales del usuario autenticado"""
        return EstadiaAnimal.objects.filter(animal__usuario=self.request.user)

class VacunaViewSet(viewsets.ModelViewSet):
    serializer_class = VacunaSerializer

    def get_queryset(self):
        """Filtrar vacunas por usuario autenticado"""
        return Vacuna.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        """Asignar el usuario actual al crear una vacuna"""
        serializer.save(usuario=self.request.user)

class VacunacionViewSet(viewsets.ModelViewSet):
    serializer_class = VacunacionSerializer

    def get_queryset(self):
        """Filtrar vacunaciones por animales del usuario autenticado"""
        queryset = Vacunacion.objects.filter(animal__usuario=self.request.user)
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

    def perform_create(self, serializer):
        # Validar que el animal y la vacuna pertenecen al usuario
        animal = serializer.validated_data['animal']
        vacuna = serializer.validated_data['vacuna']
        if animal.usuario != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No tienes permiso para vacunar este animal")
        if vacuna.usuario != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No tienes permiso para usar esta vacuna")
        
        serializer.save()

class TransferenciaViewSet(viewsets.ModelViewSet):
    serializer_class = TransferenciaSerializer

    def get_queryset(self):
        """Filtrar transferencias por animales del usuario autenticado"""
        queryset = Transferencia.objects.filter(animal__usuario=self.request.user)
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
        # Validar que el animal pertenece al usuario
        animal = serializer.validated_data['animal']
        if animal.usuario != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No tienes permiso para transferir este animal")
        
        # Validar que los campos pertenecen al usuario
        campo_origen = serializer.validated_data['campo_origen']
        campo_destino = serializer.validated_data['campo_destino']
        if campo_origen.usuario != self.request.user or campo_destino.usuario != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No tienes permiso para usar estos campos")
            
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
    serializer_class = VentaSerializer

    def get_queryset(self):
        """Filtrar ventas por animales del usuario autenticado"""
        queryset = Venta.objects.filter(animal__usuario=self.request.user)
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
        # Validar que el animal pertenece al usuario
        animal = serializer.validated_data['animal']
        if animal.usuario != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("No tienes permiso para vender este animal")
            
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
        
        # Filtrar por usuario autenticado
        user = request.user
        
        # Estadísticas básicas
        total_campos = Campo.objects.filter(usuario=user).count()
        total_lotes = Vacuno.objects.filter(usuario=user).count()  # Cada vacuno representa un lote
        
        # Lotes vendidos
        lotes_vendidos = Vacuno.objects.filter(
            usuario=user,
            historial_estados__estado_general='vendido'
        ).distinct().count()
        
        # Ventas del mes actual
        ventas_mes = Venta.objects.filter(
            animal__usuario=user,
            fecha__gte=inicio_mes
        ).aggregate(total=Sum('precio'))['total'] or Decimal('0')
        
        # Transferencias del mes actual
        transferencias_mes = Transferencia.objects.filter(
            animal__usuario=user,
            fecha__gte=inicio_mes
        ).count()
        
        # Vacunaciones del mes actual
        vacunaciones_mes = Vacunacion.objects.filter(
            animal__usuario=user,
            fecha__gte=inicio_mes
        ).count()
        
        # Promedio de lotes por campo
        promedio_lotes_por_campo = total_lotes / total_campos if total_campos > 0 else 0
        
        # Datos adicionales para el dashboard
        # Lotes por campo y animales por hectárea
        lotes_por_campo = []
        for campo in Campo.objects.filter(usuario=user):
            total_animales = sum([vacuno.cantidad for vacuno in campo.vacunos_actuales()])
            total_lotes = campo.capacidad_actual()
            animales_por_hectarea = campo.animales_por_hectarea()
            estado_ocupacion = campo.estado_ocupacion()
            
            lotes_por_campo.append({
                'campo': campo.nombre,
                'lotes': total_lotes,
                'total_animales': total_animales,
                'hectareas': float(campo.hectareas or 0),
                'animales_por_hectarea': animales_por_hectarea,
                'estado_ocupacion': estado_ocupacion,
            })
        
        # Lotes por ciclo productivo
        from django.db.models import Count
        ciclos_data = EstadoVacuno.objects.filter(
            vacuno__usuario=user
        ).values('ciclo_productivo').annotate(
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
        for campo in Campo.objects.filter(usuario=user):
            total_animales = sum([vacuno.cantidad for vacuno in campo.vacunos_actuales()])
            animales_por_hectarea = campo.animales_por_hectarea()
            estado_ocupacion = campo.estado_ocupacion()
            densidad_recomendada = 2.0  # animales por hectárea recomendado
            porcentaje_densidad = (animales_por_hectarea / densidad_recomendada * 100) if densidad_recomendada > 0 else 0
            
            densidad_campos.append({
                'campo': campo.nombre,
                'densidad_actual': animales_por_hectarea,
                'densidad_porcentaje': round(porcentaje_densidad, 1),
                'estado_ocupacion': estado_ocupacion,
                'total_animales': total_animales,
                'hectareas': float(campo.hectareas or 0),
            })
        
        # Campos por estado de ocupación
        campos_por_estado = {'baja': 0, 'media': 0, 'alta': 0}
        for campo in Campo.objects.filter(usuario=user):
            estado = campo.estado_ocupacion()
            campos_por_estado[estado] += 1
        
        campos_por_ocupacion = [
            {'estado': 'Baja (<0.8 animales/ha)', 'value': campos_por_estado['baja']},
            {'estado': 'Media (0.8-2 animales/ha)', 'value': campos_por_estado['media']},
            {'estado': 'Alta (>2 animales/ha)', 'value': campos_por_estado['alta']},
        ]
        
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
            'campos_por_ocupacion': campos_por_ocupacion,  # Nueva estadística
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
        
        # Filtrar por usuario autenticado
        user = request.user
        
        # Campos disponibles del usuario
        campos = Campo.objects.filter(usuario=user)
        
        # Vacunas disponibles del usuario
        vacunas = Vacuna.objects.filter(usuario=user)
        
        # Lotes disponibles (vacunos activos)
        lotes = []
        vacunos_activos = Vacuno.objects.filter(usuario=user)
        for vacuno in vacunos_activos:
            estado = vacuno.estado_actual()
            if not estado or estado.estado_general == 'activo':
                campo_actual = vacuno.campo_actual()
                lotes.append({
                    'id': vacuno.id,
                    'lote_id': vacuno.lote_id,
                    'raza': vacuno.raza,
                    'cantidad': vacuno.cantidad,
                    'campo': campo_actual.nombre if campo_actual else 'Sin campo',
                    'campo_actual_obj': {
                        'id': campo_actual.id if campo_actual else None,
                        'nombre': campo_actual.nombre if campo_actual else 'Sin campo'
                    },
                    'estado_actual': 'activo'
                })
        
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
            'lotes': lotes,
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
