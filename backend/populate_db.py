#!/usr/bin/env python
"""
Script para poblar la base de datos con datos de ejemplo
Ejecutar con: python manage.py shell < populate_db.py
"""

from django.contrib.auth.models import User
from ganado.models import Campo, Vacuno, EstadoVacuno, EstadiaAnimal, Vacuna, Vacunacion, Transferencia, Venta, PrecioMercado
from datetime import date, timedelta
import random

# Limpiar datos existentes (opcional)
print("Limpiando datos existentes...")
Venta.objects.all().delete()
Transferencia.objects.all().delete()
Vacunacion.objects.all().delete()
EstadiaAnimal.objects.all().delete()
EstadoVacuno.objects.all().delete()
Vacuno.objects.all().delete()
Vacuna.objects.all().delete()
Campo.objects.all().delete()
PrecioMercado.objects.all().delete()

print("Creando datos de ejemplo...")

# 1. Crear usuario administrador si no existe
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print("Usuario admin creado: admin/admin123")

# 2. Crear campos
campos_data = [
    {"nombre": "Campo Norte", "hectareas": 150.5, "ubicacion": "Zona Norte", "descripcion": "Campo principal con aguadas"},
    {"nombre": "Campo Sur", "hectareas": 120.0, "ubicacion": "Zona Sur", "descripcion": "Campo secundario"},
    {"nombre": "Potrero Central", "hectareas": 80.0, "ubicacion": "Centro", "descripcion": "Para animales en engorde"},
    {"nombre": "Campo Este", "hectareas": 200.0, "ubicacion": "Zona Este", "descripcion": "Campo más grande"},
]

campos = []
for campo_data in campos_data:
    campo = Campo.objects.create(**campo_data)
    campos.append(campo)
    print(f"Campo creado: {campo.nombre}")

# 3. Crear vacunas
vacunas_data = [
    {"nombre": "Aftosa", "laboratorio": "SENASA", "descripcion": "Vacuna contra fiebre aftosa"},
    {"nombre": "Brucelosis", "laboratorio": "SENASA", "descripcion": "Vacuna contra brucelosis bovina"},
    {"nombre": "Carbunclo", "laboratorio": "Biogenesis", "descripcion": "Vacuna contra carbunclo bacteridiano"},
    {"nombre": "IBR", "laboratorio": "Zoetis", "descripcion": "Rinotraqueitis infecciosa bovina"},
    {"nombre": "BVD", "laboratorio": "Zoetis", "descripcion": "Diarrea viral bovina"},
]

vacunas = []
for vacuna_data in vacunas_data:
    vacuna = Vacuna.objects.create(**vacuna_data)
    vacunas.append(vacuna)
    print(f"Vacuna creada: {vacuna.nombre}")

# 4. Crear vacunos
razas = ["Aberdeen Angus", "Hereford", "Shorthorn", "Brahman", "Brangus", "Santa Gertrudis", "Limousin", "Charolais"]
sexos = ["M", "H"]
ciclos_productivos = ["ternero", "novillo", "toro", "ternera", "vaquillona", "vaca"]

vacunos = []
for i in range(50):  # Crear 50 vacunos
    # Crear fecha de nacimiento aleatoria (entre 6 meses y 5 años atrás)
    dias_atras = random.randint(180, 1825)
    fecha_nacimiento = date.today() - timedelta(days=dias_atras)
    
    vacuno = Vacuno.objects.create(
        caravana=f"CAR{i+1:03d}",
        raza=random.choice(razas),
        sexo=random.choice(sexos),
        fecha_nacimiento=fecha_nacimiento,
        fecha_ingreso=fecha_nacimiento + timedelta(days=30),
        observaciones=f"Animal número {i+1}"
    )
    vacunos.append(vacuno)
    
    # Crear estado inicial
    if vacuno.sexo == "M":
        if dias_atras < 365:
            ciclo = "ternero"
        elif dias_atras < 730:
            ciclo = "novillo"
        else:
            ciclo = "toro"
    else:
        if dias_atras < 365:
            ciclo = "ternera"
        elif dias_atras < 1095:
            ciclo = "vaquillona"
        else:
            ciclo = "vaca"
    
    EstadoVacuno.objects.create(
        vacuno=vacuno,
        ciclo_productivo=ciclo,
        estado_salud="sano",
        estado_general="activo",
        observaciones="Estado inicial"
    )
    
    # Asignar a un campo aleatorio
    campo = random.choice(campos)
    EstadiaAnimal.objects.create(
        animal=vacuno,
        campo=campo,
        fecha_entrada=fecha_nacimiento + timedelta(days=30),  # Ingreso un mes después del nacimiento
        observaciones="Ingreso inicial"
    )

print(f"Creados {len(vacunos)} vacunos")

# 5. Crear vacunaciones
for vacuno in random.sample(vacunos, 30):  # 30 vacunos con vacunaciones
    for vacuna in random.sample(vacunas, random.randint(1, 3)):  # Entre 1 y 3 vacunas por animal
        fecha_vacunacion = vacuno.fecha_nacimiento + timedelta(days=random.randint(60, 300))
        if fecha_vacunacion <= date.today():
            Vacunacion.objects.create(
                animal=vacuno,
                vacuna=vacuna,
                fecha=fecha_vacunacion,
                dosis="1 ml",
                observaciones="Vacunación aplicada correctamente"
            )

print("Vacunaciones creadas")

# 6. Crear transferencias
for _ in range(10):  # 10 transferencias
    vacuno = random.choice(vacunos)
    campo_origen = random.choice(campos)
    campo_destino = random.choice([c for c in campos if c != campo_origen])
    
    fecha_transferencia = date.today() - timedelta(days=random.randint(1, 90))
    
    Transferencia.objects.create(
        animal=vacuno,
        campo_origen=campo_origen,
        campo_destino=campo_destino,
        fecha=fecha_transferencia,
        observaciones="Transferencia por manejo"
    )
    
    # Actualizar estadia
    EstadiaAnimal.objects.filter(
        animal=vacuno,
        fecha_salida__isnull=True
    ).update(fecha_salida=fecha_transferencia)
    
    EstadiaAnimal.objects.create(
        animal=vacuno,
        campo=campo_destino,
        fecha_entrada=fecha_transferencia,
        observaciones="Por transferencia"
    )

print("Transferencias creadas")

# 7. Crear ventas
vacunos_para_venta = random.sample(vacunos, 8)  # Vender 8 animales
compradores = ["Frigorífico San José", "Carnicería Central", "Exportadora Ganadera", "Frigorífico Regional"]

for vacuno in vacunos_para_venta:
    fecha_venta = date.today() - timedelta(days=random.randint(1, 60))
    precio = random.uniform(120000, 180000)
    
    Venta.objects.create(
        animal=vacuno,
        fecha=fecha_venta,
        comprador=random.choice(compradores),
        precio=precio,
        destino="Faena",
        observaciones="Venta por peso"
    )
    
    # Marcar como vendido
    EstadoVacuno.objects.create(
        vacuno=vacuno,
        estado_general='vendido',
        observaciones=f"Vendido por ${precio}"
    )
    
    # Cerrar estadia
    EstadiaAnimal.objects.filter(
        animal=vacuno,
        fecha_salida__isnull=True
    ).update(fecha_salida=fecha_venta)

print("Ventas creadas")

# 8. Crear precios de mercado
categorias = ["Ternero", "Novillo", "Toro", "Ternera", "Vaquillona", "Vaca"]
for i in range(30):  # 30 días de precios
    fecha = date.today() - timedelta(days=i)
    for categoria in categorias:
        # Precios base con variación aleatoria
        precios_base = {
            "Ternero": 140000,
            "Novillo": 160000,
            "Toro": 170000,
            "Ternera": 135000,
            "Vaquillona": 150000,
            "Vaca": 145000
        }
        precio_base = precios_base[categoria]
        variacion = random.uniform(0.9, 1.1)  # ±10%
        precio_final = precio_base * variacion
        
        PrecioMercado.objects.create(
            fecha=fecha,
            categoria=categoria,
            precio=precio_final
        )

print("Precios de mercado creados")

print("\n=== RESUMEN ===")
print(f"Campos: {Campo.objects.count()}")
print(f"Vacunos: {Vacuno.objects.count()}")
print(f"Vacunas: {Vacuna.objects.count()}")
print(f"Vacunaciones: {Vacunacion.objects.count()}")
print(f"Transferencias: {Transferencia.objects.count()}")
print(f"Ventas: {Venta.objects.count()}")
print(f"Precios de mercado: {PrecioMercado.objects.count()}")
print("\nBase de datos poblada exitosamente!")
print("Usuario admin: admin/admin123")
