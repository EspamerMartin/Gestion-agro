from rest_framework import serializers

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


class CampoSerializer(serializers.ModelSerializer):
    capacidad_actual = serializers.ReadOnlyField()
    
    class Meta:
        model = Campo
        fields = ['id', 'nombre', 'ubicacion', 'hectareas', 'descripcion', 
                 'capacidad_actual']

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
    
    class Meta:
        model = Vacuno
        fields = ['id', 'lote_id', 'raza', 'cantidad', 'sexo', 'fecha_nacimiento', 
                 'fecha_ingreso', 'observaciones', 'estado_actual_obj', 
                 'campo_actual_obj', 'edad_aproximada', 'es_vendido']
    
    def get_campo_actual_obj(self, obj):
        campo = obj.campo_actual()
        if campo:
            return {'id': campo.id, 'nombre': campo.nombre}
        return None

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

class PrecioMercadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrecioMercado
        fields = ['id', 'fecha', 'categoria', 'precio']

# Serializers para estadísticas del dashboard
class DashboardStatsSerializer(serializers.Serializer):
    total_campos = serializers.IntegerField()
    total_vacunos = serializers.IntegerField()
    total_animales = serializers.IntegerField()
    vacunos_vendidos = serializers.IntegerField()
    ventas_mes_actual = serializers.DecimalField(max_digits=12, decimal_places=2)
    transferencias_mes_actual = serializers.IntegerField()
    vacunaciones_mes_actual = serializers.IntegerField()
    promedio_vacunos_por_campo = serializers.FloatField()
    valor_total_estimado = serializers.DecimalField(max_digits=12, decimal_places=2)
    animales_por_campo = serializers.ListField(child=serializers.DictField())
    animales_por_ciclo = serializers.ListField(child=serializers.DictField())
    capacidad_campos = serializers.ListField(child=serializers.DictField())

class OpcionesSerializer(serializers.Serializer):
    campos = CampoSerializer(many=True)
    vacunas = VacunaSerializer(many=True)
    razas_disponibles = serializers.ListField(child=serializers.CharField())
    sexos_disponibles = serializers.ListField(child=serializers.DictField())
    ciclos_productivos = serializers.ListField(child=serializers.DictField())
    estados_salud = serializers.ListField(child=serializers.DictField())
    estados_generales = serializers.ListField(child=serializers.DictField())
