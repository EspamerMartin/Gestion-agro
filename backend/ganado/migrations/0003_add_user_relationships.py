# Generated manually
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def assign_default_user(apps, schema_editor):
    """Asignar el primer usuario a todos los registros existentes"""
    User = apps.get_model('auth', 'User')
    Campo = apps.get_model('ganado', 'Campo')
    Vacuno = apps.get_model('ganado', 'Vacuno')
    Vacuna = apps.get_model('ganado', 'Vacuna')
    PrecioMercado = apps.get_model('ganado', 'PrecioMercado')
    
    # Obtener el primer usuario o crear uno por defecto
    try:
        default_user = User.objects.first()
        if not default_user:
            default_user = User.objects.create_user(
                username='admin',
                email='admin@example.com',
                password='admin123'
            )
    except:
        return  # Si hay error, continuar sin asignar
    
    # Asignar usuario a campos existentes
    Campo.objects.filter(usuario__isnull=True).update(usuario=default_user)
    
    # Asignar usuario a vacunos existentes
    Vacuno.objects.filter(usuario__isnull=True).update(usuario=default_user)
    
    # Asignar usuario a vacunas existentes
    Vacuna.objects.filter(usuario__isnull=True).update(usuario=default_user)
    
    # Asignar usuario a precios de mercado existentes
    PrecioMercado.objects.filter(usuario__isnull=True).update(usuario=default_user)


def reverse_assign_default_user(apps, schema_editor):
    """Reverse operation (no-op)"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('ganado', '0002_remove_vacuno_caravana_vacuno_cantidad_and_more'),
    ]

    operations = [
        # Agregar campos de usuario como opcionales primero
        migrations.AddField(
            model_name='campo',
            name='usuario',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='campos', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='vacuno',
            name='usuario',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='vacunos', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='vacuna',
            name='usuario',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='vacunas', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='preciomercado',
            name='usuario',
            field=models.ForeignKey(null=True, blank=True, on_delete=django.db.models.deletion.CASCADE, related_name='precios_mercado', to=settings.AUTH_USER_MODEL),
        ),
        
        # Asignar usuario por defecto a registros existentes
        migrations.RunPython(assign_default_user, reverse_assign_default_user),
        
        # Hacer los campos obligatorios
        migrations.AlterField(
            model_name='campo',
            name='usuario',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='campos', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='vacuno',
            name='usuario',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='vacunos', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='vacuna',
            name='usuario',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='vacunas', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='preciomercado',
            name='usuario',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='precios_mercado', to=settings.AUTH_USER_MODEL),
        ),
        
        # Actualizar unique_together constraints
        migrations.AlterUniqueTogether(
            name='campo',
            unique_together={('usuario', 'nombre')},
        ),
        migrations.AlterUniqueTogether(
            name='preciomercado',
            unique_together={('usuario', 'fecha', 'categoria')},
        ),
        
        # Remover la constraint unique anterior de campo nombre
        migrations.AlterField(
            model_name='campo',
            name='nombre',
            field=models.CharField(max_length=50),
        ),
    ]
