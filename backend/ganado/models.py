from django.db import models

class Campo(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    ubicacion = models.CharField(max_length=255)  # Ej: "La Pampa RN9 KM70"
    hectareas = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    descripcion = models.TextField(blank=True)

    def vacunos_actuales(self):
        """Devuelve los vacunos que están actualmente en este campo"""
        return Vacuno.objects.filter(estadias__campo=self, estadias__fecha_salida__isnull=True)
    
    def capacidad_actual(self):
        """Cantidad de vacunos actualmente en el campo"""
        return self.vacunos_actuales().count()

    def __str__(self):
        return self.nombre

class Vacuno(models.Model):
    SEXO_CHOICES = (
        ("M", "Macho"),
        ("H", "Hembra"),
    )
    caravana = models.CharField(max_length=50, unique=True)
    raza = models.CharField(max_length=50)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    sexo = models.CharField(
        max_length=1,
        choices=SEXO_CHOICES
    )
    fecha_ingreso = models.DateField()
    observaciones = models.TextField(blank=True)

    # Acceso al historial de estados:
    # Gracias a related_name="historial_estados" en EstadoVacuno,
    # puedes hacer vacuno.historial_estados.all() para obtener todos los estados históricos
    # y vacuno.estado_actual() para obtener el último estado registrado.
    def estado_actual(self):
        """
        Devuelve el último estado registrado del vacuno (EstadoVacuno más reciente).
        Utiliza el related_name 'historial_estados' definido en EstadoVacuno.
        """
        return self.historial_estados.order_by('-fecha').first()
    
    def campo_actual(self):
        """Devuelve el campo donde se encuentra actualmente el vacuno"""
        estadia_actual = self.estadias.filter(fecha_salida__isnull=True).first()
        return estadia_actual.campo if estadia_actual else None
    
    def edad_aproximada(self):
        """Calcula la edad aproximada en días si tiene fecha de nacimiento"""
        if self.fecha_nacimiento:
            from datetime import date
            return (date.today() - self.fecha_nacimiento).days
        return None
    
    def vacunas_pendientes(self):
        """Devuelve las vacunas que no ha recibido este vacuno"""
        vacunas_aplicadas = self.vacunaciones.values_list('vacuna_id', flat=True)
        return Vacuna.objects.exclude(id__in=vacunas_aplicadas)
    
    def is_vendido(self):
        """Verifica si el animal está vendido"""
        estado = self.estado_actual()
        return estado and estado.estado_general == 'vendido'

    def __str__(self):
        return f"{self.caravana} - {self.raza}"


# Modelo para historial de estados del vacuno
class EstadoVacuno(models.Model):
    CICLO_PRODUCTIVO_CHOICES = (
        ("ternero", "Ternero"),
        ("novillo", "Novillo"),
        ("toro", "Toro"),
        ("ternera", "Ternera"),
        ("vaquillona", "Vaquillona"),
        ("vaca", "Vaca"),
    )
    ESTADO_SALUD_CHOICES = (
        ("sano", "Sano"),
        ("brucelosis", "Brucelosis"),
        ("tuberculosis", "Tuberculosis"),
        ("otra", "Otra"),
    )
    ESTADO_GENERAL_CHOICES = (
        ("activo", "Activo"),
        ("vendido", "Vendido"),
        ("muerto", "Muerto"),
        ("transferido", "Transferido"),
    )
    vacuno = models.ForeignKey('Vacuno', on_delete=models.CASCADE, related_name="historial_estados")
    fecha = models.DateField(auto_now_add=True)
    ciclo_productivo = models.CharField(
        max_length=20,
        choices=CICLO_PRODUCTIVO_CHOICES,
        blank=True,
        help_text="ternero/novillo/toro o ternera/vaquillona/vaca según sexo"
    )
    estado_salud = models.CharField(
        max_length=20,
        choices=ESTADO_SALUD_CHOICES,
        blank=True
    )
    estado_general = models.CharField(
        max_length=20,
        choices=ESTADO_GENERAL_CHOICES,
        blank=True
    )
    observaciones = models.TextField(blank=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name = "Estado del Vacuno"
        verbose_name_plural = "Estados de Vacunos"

    def __str__(self):
        return f"{self.vacuno} - {self.estado_general} ({self.fecha})"

class EstadiaAnimal(models.Model):
    animal = models.ForeignKey(Vacuno, on_delete=models.CASCADE, related_name="estadias")
    campo = models.ForeignKey(Campo, on_delete=models.CASCADE)
    fecha_entrada = models.DateField()
    fecha_salida = models.DateField(null=True, blank=True)
    observaciones = models.TextField(blank=True)

    def __str__(self):
        return f"{self.animal} en {self.campo} desde {self.fecha_entrada}"

class Vacuna(models.Model):
    nombre = models.CharField(max_length=100)
    laboratorio = models.CharField(max_length=100, blank=True)
    descripcion = models.TextField(blank=True)

    def __str__(self):
        return self.nombre

class Vacunacion(models.Model):
    animal = models.ForeignKey(Vacuno, on_delete=models.CASCADE, related_name="vacunaciones")
    vacuna = models.ForeignKey(Vacuna, on_delete=models.CASCADE)
    fecha = models.DateField()
    dosis = models.CharField(max_length=50, blank=True)
    observaciones = models.TextField(blank=True)

    def __str__(self):
        return f"{self.animal} - {self.vacuna} ({self.fecha})"

class Transferencia(models.Model):
    animal = models.ForeignKey(Vacuno, on_delete=models.CASCADE)
    campo_origen = models.ForeignKey(Campo, on_delete=models.CASCADE, related_name="transferencias_salida")
    campo_destino = models.ForeignKey(Campo, on_delete=models.CASCADE, related_name="transferencias_entrada")
    fecha = models.DateField()
    observaciones = models.TextField(blank=True)

    def __str__(self):
        return f"{self.animal} de {self.campo_origen} a {self.campo_destino} ({self.fecha})"

class Venta(models.Model):
    animal = models.ForeignKey(Vacuno, on_delete=models.CASCADE)
    fecha = models.DateField()
    comprador = models.CharField(max_length=100)
    precio = models.DecimalField(max_digits=12, decimal_places=2)
    destino = models.CharField(max_length=100, blank=True)
    observaciones = models.TextField(blank=True)

    def __str__(self):
        return f"{self.animal} vendido a {self.comprador} ({self.fecha})"

class PrecioMercado(models.Model):
    fecha = models.DateField()
    categoria = models.CharField(max_length=50)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    
    class Meta:
        ordering = ['-fecha']
        unique_together = ['fecha', 'categoria']
        verbose_name = "Precio de Mercado"
        verbose_name_plural = "Precios de Mercado"

    def __str__(self):
        return f"{self.categoria} - ${self.precio} ({self.fecha})"
