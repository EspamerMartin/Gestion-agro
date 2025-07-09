#!/usr/bin/env python
"""
Script para poblar la base de datos con datos de ejemplo
Ejecutar desde la raíz del proyecto: python manage.py shell < populate_db.py
"""

import os
import django
from datetime import date, timedelta
from decimal import Decimal

# Configurar Django ANTES de importar los modelos
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Ahora sí podemos importar los modelos
from ganado.models import Campo, Vacuno, EstadoVacuno, EstadiaAnimal, Vacuna, Vacunacion, Transferencia, Venta, PrecioMercado  # noqa: E402


def poblar_campos():
    """Crear campos de ejemplo"""
    campos_data = [
        {"nombre": "La Esperanza", "ubicacion": "La Pampa RN9 KM70", "hectareas": Decimal("1250.50"), "descripcion": "Campo principal con pasturas naturales"},
        {"nombre": "El Progreso", "ubicacion": "Buenos Aires RN5 KM120", "hectareas": Decimal("800.75"), "descripcion": "Campo con alfalfares y maíz"},
        {"nombre": "San Juan", "ubicacion": "Córdoba RP3 KM45", "hectareas": Decimal("2100.25"), "descripcion": "Campo mixto ganadero-agrícola"},
        {"nombre": "Las Flores", "ubicacion": "Santa Fe RN11 KM200", "hectareas": Decimal("950.00"), "descripcion": "Campo especializado en cría"},
    ]
    
    for data in campos_data:
        campo, created = Campo.objects.get_or_create(
            nombre=data["nombre"],
            defaults=data
        )
        if created:
            print(f"✓ Campo creado: {campo.nombre}")

def poblar_vacunas():
    """Crear vacunas de ejemplo"""
    vacunas_data = [
        {"nombre": "Brucelosis", "laboratorio": "Laboratorio Veterinario SA", "descripcion": "Vacuna contra brucelosis bovina"},
        {"nombre": "Aftosa", "laboratorio": "BioVet Argentina", "descripcion": "Vacuna antiaftosa"},
        {"nombre": "Carbunco", "laboratorio": "Laboratorio Veterinario SA", "descripcion": "Vacuna contra carbunco sintomático"},
        {"nombre": "IBR-IPV", "laboratorio": "VetPharma", "descripcion": "Vacuna contra rinotraqueitis y vulvovaginitis"},
        {"nombre": "Clostridios", "laboratorio": "BioVet Argentina", "descripcion": "Vacuna polivalente contra clostridios"},
    ]
    
    for data in vacunas_data:
        vacuna, created = Vacuna.objects.get_or_create(
            nombre=data["nombre"],
            defaults=data
        )
        if created:
            print(f"✓ Vacuna creada: {vacuna.nombre}")

def poblar_vacunos():
    """Crear vacunos de ejemplo con lógica consistente"""
    campos = list(Campo.objects.all())
    
    vacunos_data = [
        {"caravana": "ARG001", "raza": "Aberdeen Angus", "sexo": "M", "fecha_nacimiento": date(2022, 3, 15)},
        {"caravana": "ARG002", "raza": "Hereford", "sexo": "H", "fecha_nacimiento": date(2021, 8, 22)},
        {"caravana": "ARG003", "raza": "Brahman", "sexo": "M", "fecha_nacimiento": date(2023, 1, 10)},
        {"caravana": "ARG004", "raza": "Aberdeen Angus", "sexo": "H", "fecha_nacimiento": date(2022, 11, 5)},
        {"caravana": "ARG005", "raza": "Limousin", "sexo": "M", "fecha_nacimiento": date(2021, 6, 18)},
        {"caravana": "ARG006", "raza": "Charolais", "sexo": "H", "fecha_nacimiento": date(2023, 4, 2)},
        {"caravana": "ARG007", "raza": "Brangus", "sexo": "M", "fecha_nacimiento": date(2022, 9, 14)},
        {"caravana": "ARG008", "raza": "Hereford", "sexo": "H", "fecha_nacimiento": date(2021, 12, 30)},
    ]
    
    for i, data in enumerate(vacunos_data):
        data["fecha_ingreso"] = date(2024, 1, 1) + timedelta(days=i*15)
        data["observaciones"] = f"Animal ingresado el {data['fecha_ingreso']}"
        
        vacuno, created = Vacuno.objects.get_or_create(
            caravana=data["caravana"],
            defaults=data
        )
        if created:
            print(f"✓ Vacuno creado: {vacuno.caravana} - {vacuno.raza}")
            
            # Determinar ciclo productivo según edad y sexo
            edad_dias = (date.today() - vacuno.fecha_nacimiento).days
            
            if vacuno.sexo == "M":  # Macho
                if edad_dias < 365:
                    ciclo = "ternero"
                elif edad_dias < 730:  # 2 años
                    ciclo = "novillo"
                else:
                    ciclo = "toro"
            else:  # Hembra
                if edad_dias < 365:
                    ciclo = "ternera"
                elif edad_dias < 1095:  # 3 años o sin parir
                    ciclo = "vaquillona"
                else:
                    ciclo = "vaca"
            
            # Crear estado inicial
            EstadoVacuno.objects.create(
                vacuno=vacuno,
                ciclo_productivo=ciclo,
                estado_salud="sano",
                estado_general="activo",
                observaciones=f"Estado inicial al ingreso - {ciclo}"
            )
            
            # Crear estadia inicial en campo
            campo = campos[i % len(campos)]
            EstadiaAnimal.objects.create(
                animal=vacuno,
                campo=campo,
                fecha_entrada=data["fecha_ingreso"],
                observaciones=f"Ingreso inicial a {campo.nombre}"
            )

def poblar_vacunaciones():
    """Crear vacunaciones de ejemplo"""
    vacunos = list(Vacuno.objects.all())
    vacunas = list(Vacuna.objects.all())
    
    # Vacunar algunos animales
    for i, vacuno in enumerate(vacunos[:5]):  # Solo los primeros 5
        for j, vacuna in enumerate(vacunas[:3]):  # Solo las primeras 3 vacunas
            fecha_vacuna = vacuno.fecha_ingreso + timedelta(days=30 + j*45)
            
            Vacunacion.objects.get_or_create(
                animal=vacuno,
                vacuna=vacuna,
                fecha=fecha_vacuna,
                defaults={
                    "dosis": "5ml",
                    "observaciones": f"Vacunación de rutina - {vacuna.nombre}"
                }
            )
    print(f"✓ Creadas vacunaciones para {len(vacunos[:5])} animales")

def poblar_transferencias():
    """Crear transferencias siguiendo el modelo de negocio correcto"""
    vacunos = list(Vacuno.objects.all())
    campos = list(Campo.objects.all())
    
    if len(campos) >= 2:
        # Transferir algunos animales entre campos
        for i in range(3):  # 3 transferencias
            vacuno = vacunos[i]
            
            # Obtener estadia actual
            estadia_actual = EstadiaAnimal.objects.filter(
                animal=vacuno, 
                fecha_salida__isnull=True
            ).first()
            
            if estadia_actual:
                campo_origen = estadia_actual.campo
                # Elegir campo destino diferente
                campos_disponibles = [c for c in campos if c != campo_origen]
                campo_destino = campos_disponibles[0]
                
                fecha_transfer = date(2024, 6, 1) + timedelta(days=i*30)
                
                # 1. Crear transferencia
                transferencia, created = Transferencia.objects.get_or_create(
                    animal=vacuno,
                    campo_origen=campo_origen,
                    campo_destino=campo_destino,
                    fecha=fecha_transfer,
                    defaults={
                        "observaciones": "Transferencia por rotación de pasturas"
                    }
                )
                
                if created:
                    # 2. Cerrar estadia anterior
                    estadia_actual.fecha_salida = fecha_transfer
                    estadia_actual.observaciones += f" - Transferido el {fecha_transfer}"
                    estadia_actual.save()
                    
                    # 3. Crear nueva estadia
                    EstadiaAnimal.objects.create(
                        animal=vacuno,
                        campo=campo_destino,
                        fecha_entrada=fecha_transfer,
                        observaciones=f"Transferido desde {campo_origen.nombre}"
                    )
                    
                    # 4. Actualizar estado del animal
                    EstadoVacuno.objects.create(
                        vacuno=vacuno,
                        estado_general="transferido",
                        observaciones=f"Transferido de {campo_origen.nombre} a {campo_destino.nombre}"
                    )
                    
                    # 5. Inmediatamente después, volver a estado activo en nuevo campo
                    EstadoVacuno.objects.create(
                        vacuno=vacuno,
                        estado_general="activo",
                        observaciones=f"Activo en {campo_destino.nombre}"
                    )
                    
        print("✓ Creadas 3 transferencias con trazabilidad completa")

def poblar_ventas():
    """Crear ventas siguiendo el modelo de negocio"""
    vacunos = list(Vacuno.objects.all())
    
    compradores = ["Frigorífico San José", "Exportadora Ganadera SA", "Carnicería El Gaucho"]
    
    # Solo vender animales que estén en condiciones apropiadas (edad mínima)
    animales_para_venta = []
    for vacuno in vacunos:
        edad_dias = (date.today() - vacuno.fecha_nacimiento).days
        # Solo vender animales con más de 18 meses (540 días)
        if edad_dias > 540:
            animales_para_venta.append(vacuno)
    
    for i in range(min(2, len(animales_para_venta))):  # Máximo 2 ventas
        vacuno = animales_para_venta[i]
        fecha_venta = date(2024, 8, 1) + timedelta(days=i*15)
        
        # Calcular precio según tipo y edad
        edad_dias = (fecha_venta - vacuno.fecha_nacimiento).days
        precio_base = 450000  # Precio base
        
        if vacuno.sexo == "M":
            if edad_dias > 730:  # Más de 2 años
                precio_base = 550000  # Novillo/Toro
            else:
                precio_base = 480000  # Ternero grande
        else:
            if edad_dias > 1095:  # Más de 3 años
                precio_base = 420000  # Vaca
            else:
                precio_base = 450000  # Vaquillona
        
        venta = Venta.objects.create(
            animal=vacuno,
            fecha=fecha_venta,
            comprador=compradores[i % len(compradores)],
            precio=Decimal(str(precio_base + i * 25000)),
            destino="Faena",
            observaciones=f"Venta por peso óptimo - {edad_dias} días de edad"
        )
        
        # 1. Cerrar estadia actual
        estadia_actual = EstadiaAnimal.objects.filter(
            animal=vacuno,
            fecha_salida__isnull=True
        ).first()
        if estadia_actual:
            estadia_actual.fecha_salida = fecha_venta
            estadia_actual.observaciones += f" - Vendido el {fecha_venta}"
            estadia_actual.save()
        
        # 2. Cambiar estado del animal a vendido
        EstadoVacuno.objects.create(
            vacuno=vacuno,
            estado_general="vendido",
            observaciones=f"Vendido a {venta.comprador} por ${venta.precio}"
        )
        
    print(f"✓ Creadas {min(2, len(animales_para_venta))} ventas con trazabilidad completa")

def poblar_precios_mercado():
    """Crear precios de mercado realistas para Argentina"""
    categorias = {
        "Novillo": {"base": 1850, "variacion": 50},
        "Vaquillona": {"base": 1680, "variacion": 40}, 
        "Ternero": {"base": 2300, "variacion": 60},
        "Ternera": {"base": 2100, "variacion": 55},
        "Vaca": {"base": 1420, "variacion": 35},
        "Toro": {"base": 1950, "variacion": 45}
    }
    
    # Precios de los últimos 30 días con tendencias realistas
    fecha_base = date.today() - timedelta(days=30)
    
    for dias in range(0, 31, 3):  # Cada 3 días (más realista)
        fecha_precio = fecha_base + timedelta(days=dias)
        
        for categoria, config in categorias.items():
            # Simular variación de precios con tendencia
            tendencia = dias * 2  # Leve tendencia alcista
            variacion_diaria = (dias % 7 - 3) * config["variacion"] // 3  # Variación semanal
            
            precio_final = config["base"] + tendencia + variacion_diaria
            
            PrecioMercado.objects.get_or_create(
                fecha=fecha_precio,
                categoria=categoria,
                defaults={"precio": Decimal(str(precio_final))}
            )
    
    print("✓ Creados precios de mercado realistas para 30 días")

def main():
    """Función principal para poblar toda la base de datos"""
    print("🐄 Iniciando población de la base de datos...")
    print("=" * 50)
    
    poblar_campos()
    print()
    poblar_vacunas()
    print()
    poblar_vacunos()
    print()
    poblar_vacunaciones()
    print()
    poblar_transferencias()
    print()
    poblar_ventas()
    print()
    poblar_precios_mercado()
    
    print("=" * 50)
    print("✅ Base de datos poblada exitosamente!")
    print("📊 Resumen:")
    print(f"   - Campos: {Campo.objects.count()}")
    print(f"   - Vacunos: {Vacuno.objects.count()}")
    print(f"   - Estados: {EstadoVacuno.objects.count()}")
    print(f"   - Estadías: {EstadiaAnimal.objects.count()}")
    print(f"   - Vacunas: {Vacuna.objects.count()}")
    print(f"   - Vacunaciones: {Vacunacion.objects.count()}")
    print(f"   - Transferencias: {Transferencia.objects.count()}")
    print(f"   - Ventas: {Venta.objects.count()}")
    print(f"   - Precios: {PrecioMercado.objects.count()}")

if __name__ == "__main__":
    main()
