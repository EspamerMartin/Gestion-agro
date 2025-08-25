#!/usr/bin/env python
"""
Script para probar la nueva funcionalidad de estado de ocupación de campos
"""
import os
import sys
import django

# Configurar Django
sys.path.append('c:/Users/marti/Desktop/repos/GESTION_AGRO/Gestion-Agro/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from ganado.models import Campo, Vacuno, EstadiaAnimal
from datetime import date

def test_estado_ocupacion():
    print("🧪 Probando funcionalidad de estado de ocupación de campos")
    print("=" * 60)
    
    # Obtener o crear un usuario de prueba
    user, created = User.objects.get_or_create(
        username='test_user',
        defaults={'email': 'test@example.com', 'first_name': 'Test'}
    )
    print(f"Usuario: {user.username} {'(creado)' if created else '(existente)'}")
    
    # Crear campo de prueba
    campo, created = Campo.objects.get_or_create(
        usuario=user,
        nombre='Campo de Prueba',
        defaults={
            'ubicacion': 'Ubicación de prueba',
            'hectareas': 10.0,
            'descripcion': 'Campo para probar estado de ocupación'
        }
    )
    print(f"Campo: {campo.nombre} - {campo.hectareas} hectáreas {'(creado)' if created else '(existente)'}")
    
    # Verificar estado inicial (sin animales)
    print(f"\n📊 Estado inicial del campo:")
    print(f"   Animales actuales: {sum([v.cantidad for v in campo.vacunos_actuales()])}")
    print(f"   Animales por hectárea: {campo.animales_por_hectarea()}")
    print(f"   Estado de ocupación: {campo.estado_ocupacion()}")
    
    # Crear vacunos con diferentes cantidades para probar estados
    scenarios = [
        {"cantidad": 5, "descripcion": "Baja ocupación (<0.8 animales/ha)"},
        {"cantidad": 15, "descripcion": "Media ocupación (0.8-2 animales/ha)"},
        {"cantidad": 25, "descripcion": "Alta ocupación (>2 animales/ha)"},
    ]
    
    for i, scenario in enumerate(scenarios, 1):
        print(f"\n🐄 Escenario {i}: {scenario['descripcion']}")
        
        # Limpiar vacunos anteriores
        Vacuno.objects.filter(usuario=user).delete()
        
        # Crear vacuno
        vacuno = Vacuno.objects.create(
            usuario=user,
            lote_id=f'LOTE-TEST-{i}',
            raza='Test',
            cantidad=scenario['cantidad'],
            sexo='M',
            fecha_ingreso=date.today()
        )
        
        # Crear estadia
        EstadiaAnimal.objects.create(
            animal=vacuno,
            campo=campo,
            fecha_entrada=date.today()
        )
        
        # Verificar estado
        densidad = campo.animales_por_hectarea()
        estado = campo.estado_ocupacion()
        
        print(f"   Animales: {scenario['cantidad']}")
        print(f"   Densidad: {densidad} animales/ha")
        print(f"   Estado: {estado}")
        
        # Verificar que el estado es correcto
        if scenario['cantidad'] == 5:
            expected = 'baja'
        elif scenario['cantidad'] == 15:
            expected = 'media'
        else:
            expected = 'alta'
            
        if estado == expected:
            print(f"   ✅ Estado correcto: {estado}")
        else:
            print(f"   ❌ Estado incorrecto. Esperado: {expected}, Obtenido: {estado}")
    
    print(f"\n🎉 Pruebas completadas!")

if __name__ == '__main__':
    test_estado_ocupacion()
