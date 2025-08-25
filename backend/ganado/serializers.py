from django.contrib.auth.models import User
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework import serializers

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


class CampoSerializer(serializers.ModelSerializer):
    capacidad_actual = serializers.ReadOnlyField()
    vacunos_actuales = serializers.SerializerMethodField()
    total_animales = serializers.SerializerMethodField()
    animales_por_hectarea = serializers.SerializerMethodField()
    
    class Meta:
        model = Campo
        fields = ['id', 'nombre', 'ubicacion', 'hectareas', 'descripcion', 
                 'capacidad_actual', 'vacunos_actuales', 'total_animales', 'animales_por_hectarea']
    
    def get_vacunos_actuales(self, obj):
        vacunos = obj.vacunos_actuales()
        return [{
            'id': v.id,
            'lote_id': v.lote_id,
            'raza': v.raza,
            'cantidad': v.cantidad,
            'sexo': v.sexo,
            'fecha_ingreso': v.fecha_ingreso
        } for v in vacunos]
    
    def get_total_animales(self, obj):
        return sum([v.cantidad for v in obj.vacunos_actuales()])
    
    def get_animales_por_hectarea(self, obj):
        total_animales = self.get_total_animales(obj)
        if obj.hectareas and obj.hectareas > 0:
            return round(total_animales / float(obj.hectareas), 2)
        return 0

class EstadoVacunoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoVacuno
        fields = ['id', 'vacuno', 'fecha', 'ciclo_productivo', 'estado_salud', 
                 'estado_general', 'observaciones']

class EstadiaAnimalSerializer(serializers.ModelSerializer):
    campo_nombre = serializers.CharField(source='campo.nombre', read_only=True)
    
    class Meta:
        model = EstadiaAnimal
        fields = ['id', 'animal', 'campo', 'campo_nombre', 'fecha_entrada', 
                 'fecha_salida', 'observaciones']

class VacunoSerializer(serializers.ModelSerializer):
    estado_actual_obj = EstadoVacunoSerializer(source='estado_actual', read_only=True)
    campo_actual_obj = serializers.SerializerMethodField()
    edad_aproximada = serializers.ReadOnlyField()
    es_vendido = serializers.ReadOnlyField(source='is_vendido')
    campo_inicial = serializers.IntegerField(write_only=True, required=False, help_text="ID del campo inicial donde se ubicará el vacuno (solo para creación)")
    
    class Meta:
        model = Vacuno
        fields = ['id', 'lote_id', 'raza', 'cantidad', 'sexo', 'fecha_nacimiento', 
                 'fecha_ingreso', 'observaciones', 'estado_actual_obj', 
                 'campo_actual_obj', 'edad_aproximada', 'es_vendido', 'campo_inicial']
    
    def get_campo_actual_obj(self, obj):
        campo = obj.campo_actual()
        if campo:
            return {'id': campo.id, 'nombre': campo.nombre}
        return None
    
    def validate(self, attrs):
        # Remover campo_inicial de los datos si estamos actualizando
        if self.instance:  # Si ya existe el objeto (actualización)
            attrs.pop('campo_inicial', None)
        return attrs

class VacunaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vacuna
        fields = ['id', 'nombre', 'laboratorio', 'descripcion']

class VacunacionSerializer(serializers.ModelSerializer):
    animal_lote_id = serializers.CharField(source='animal.lote_id', read_only=True)
    vacuna_nombre = serializers.CharField(source='vacuna.nombre', read_only=True)
    
    class Meta:
        model = Vacunacion
        fields = ['id', 'animal', 'animal_lote_id', 'vacuna', 
                 'vacuna_nombre', 'fecha', 'dosis', 'observaciones']

class TransferenciaSerializer(serializers.ModelSerializer):
    animal_lote_id = serializers.CharField(source='animal.lote_id', read_only=True)
    campo_origen_nombre = serializers.CharField(source='campo_origen.nombre', read_only=True)
    campo_destino_nombre = serializers.CharField(source='campo_destino.nombre', read_only=True)
    
    class Meta:
        model = Transferencia
        fields = ['id', 'animal', 'animal_lote_id', 'campo_origen', 
                 'campo_origen_nombre', 'campo_destino', 'campo_destino_nombre', 
                 'fecha', 'observaciones']

class VentaSerializer(serializers.ModelSerializer):
    animal_lote_id = serializers.CharField(source='animal.lote_id', read_only=True)
    
    class Meta:
        model = Venta
        fields = ['id', 'animal', 'animal_lote_id', 'fecha', 
                 'comprador', 'precio', 'destino', 'observaciones']
# Serializers para estadísticas del dashboard
class DashboardStatsSerializer(serializers.Serializer):
    total_campos = serializers.IntegerField()
    total_vacunos = serializers.IntegerField()  # Para compatibilidad
    total_animales = serializers.IntegerField()  # Para compatibilidad
    total_lotes = serializers.IntegerField()
    vacunos_vendidos = serializers.IntegerField()  # Para compatibilidad
    lotes_vendidos = serializers.IntegerField()
    ventas_mes_actual = serializers.DecimalField(max_digits=12, decimal_places=2)
    transferencias_mes_actual = serializers.IntegerField()
    vacunaciones_mes_actual = serializers.IntegerField()
    promedio_vacunos_por_campo = serializers.FloatField()  # Para compatibilidad
    promedio_lotes_por_campo = serializers.FloatField()
    animales_por_campo = serializers.ListField(child=serializers.DictField())  # Para compatibilidad
    lotes_por_campo = serializers.ListField(child=serializers.DictField())
    animales_por_ciclo = serializers.ListField(child=serializers.DictField())  # Para compatibilidad
    lotes_por_ciclo = serializers.ListField(child=serializers.DictField())
    capacidad_campos = serializers.ListField(child=serializers.DictField())  # Para compatibilidad
    densidad_campos = serializers.ListField(child=serializers.DictField())

class OpcionesSerializer(serializers.Serializer):
    campos = CampoSerializer(many=True)
    vacunas = VacunaSerializer(many=True)
    razas_disponibles = serializers.ListField(child=serializers.CharField())
    sexos_disponibles = serializers.ListField(child=serializers.DictField())
    ciclos_productivos = serializers.ListField(child=serializers.DictField())
    estados_salud = serializers.ListField(child=serializers.DictField())
    estados_generales = serializers.ListField(child=serializers.DictField())


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'confirm_password']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True}
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return attrs
    
    def validate_email(self, value):
        # Validar formato de email
        try:
            validate_email(value)
        except ValidationError:
            raise serializers.ValidationError("Por favor ingrese un email válido con formato correcto (ejemplo@dominio.com)")
        
        # Validar que no exista
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está registrado")
        return value
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso")
        return value
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user
