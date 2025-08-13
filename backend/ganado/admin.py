from django.contrib import admin

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


@admin.register(Campo)
class CampoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'ubicacion', 'hectareas', 'capacidad_actual']
    search_fields = ['nombre', 'ubicacion']
    list_filter = ['hectareas']

@admin.register(Vacuno)
class VacunoAdmin(admin.ModelAdmin):
    list_display = ['lote_id', 'raza', 'cantidad', 'sexo', 'fecha_nacimiento', 'fecha_ingreso', 'campo_actual']
    search_fields = ['lote_id', 'raza']
    list_filter = ['sexo', 'raza', 'fecha_ingreso']
    date_hierarchy = 'fecha_ingreso'

@admin.register(EstadoVacuno)
class EstadoVacunoAdmin(admin.ModelAdmin):
    list_display = ['vacuno', 'fecha', 'ciclo_productivo', 'estado_salud', 'estado_general']
    list_filter = ['ciclo_productivo', 'estado_salud', 'estado_general', 'fecha']
    search_fields = ['vacuno__caravana']
    date_hierarchy = 'fecha'

@admin.register(EstadiaAnimal)
class EstadiaAnimalAdmin(admin.ModelAdmin):
    list_display = ['animal', 'campo', 'fecha_entrada', 'fecha_salida']
    list_filter = ['campo', 'fecha_entrada']
    search_fields = ['animal__caravana', 'campo__nombre']

@admin.register(Vacuna)
class VacunaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'laboratorio']
    search_fields = ['nombre', 'laboratorio']

@admin.register(Vacunacion)
class VacunacionAdmin(admin.ModelAdmin):
    list_display = ['animal', 'vacuna', 'fecha', 'dosis']
    list_filter = ['vacuna', 'fecha']
    search_fields = ['animal__caravana', 'vacuna__nombre']
    date_hierarchy = 'fecha'

@admin.register(Transferencia)
class TransferenciaAdmin(admin.ModelAdmin):
    list_display = ['animal', 'campo_origen', 'campo_destino', 'fecha']
    list_filter = ['campo_origen', 'campo_destino', 'fecha']
    search_fields = ['animal__caravana']
    date_hierarchy = 'fecha'

@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = ['animal', 'comprador', 'precio', 'fecha']
    list_filter = ['fecha', 'comprador']
    search_fields = ['animal__caravana', 'comprador']
    date_hierarchy = 'fecha'

@admin.register(PrecioMercado)
class PrecioMercadoAdmin(admin.ModelAdmin):
    list_display = ['categoria', 'precio', 'fecha']
    list_filter = ['categoria', 'fecha']
    search_fields = ['categoria']
    date_hierarchy = 'fecha'
