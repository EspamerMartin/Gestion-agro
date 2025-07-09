from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from datetime import date
from decimal import Decimal
from .models import Campo, Vacuno, EstadoVacuno, EstadiaAnimal, Vacuna, Vacunacion, Transferencia, Venta, PrecioMercado


class CampoModelTest(TestCase):
    """Tests unitarios para el modelo Campo"""
    
    def test_campo_creation(self):
        """Test creación básica de campo"""
        campo = Campo.objects.create(
            nombre="Campo Test",
            ubicacion="La Pampa RN9 KM70",
            hectareas=Decimal("1250.50"),
            descripcion="Campo de prueba"
        )
        
        self.assertEqual(campo.nombre, "Campo Test")
        self.assertEqual(campo.ubicacion, "La Pampa RN9 KM70")
        self.assertEqual(campo.hectareas, Decimal("1250.50"))
        self.assertEqual(str(campo), "Campo Test")
    
    def test_campo_nombre_unique(self):
        """Test que el nombre del campo sea único"""
        Campo.objects.create(nombre="Campo Único", ubicacion="Test")
        
        with self.assertRaises(IntegrityError):
            Campo.objects.create(nombre="Campo Único", ubicacion="Test 2")
    
    def test_campo_campos_requeridos(self):
        """Test campos requeridos"""
        campo = Campo(nombre="", ubicacion="Test")
        with self.assertRaises(ValidationError):
            campo.full_clean()
    
    def test_capacidad_actual_method(self):
        """Test método capacidad_actual sin animales"""
        campo = Campo.objects.create(nombre="Test", ubicacion="Test")
        self.assertEqual(campo.capacidad_actual(), 0)


class VacunoModelTest(TestCase):
    """Tests unitarios para el modelo Vacuno"""
    
    def test_vacuno_creation(self):
        """Test creación básica de vacuno"""
        vacuno = Vacuno.objects.create(
            caravana="TEST001",
            raza="Aberdeen Angus",
            sexo="M",
            fecha_nacimiento=date(2022, 1, 1),
            fecha_ingreso=date(2024, 1, 1)
        )
        
        self.assertEqual(vacuno.caravana, "TEST001")
        self.assertEqual(vacuno.raza, "Aberdeen Angus")
        self.assertEqual(vacuno.sexo, "M")
        self.assertEqual(str(vacuno), "TEST001 - Aberdeen Angus")
    
    def test_vacuno_caravana_unique(self):
        """Test que la caravana sea única"""
        Vacuno.objects.create(caravana="UNIQUE001", raza="Test", sexo="M", fecha_ingreso=date.today())
        
        with self.assertRaises(IntegrityError):
            Vacuno.objects.create(caravana="UNIQUE001", raza="Test", sexo="H", fecha_ingreso=date.today())
    
    def test_edad_aproximada_method(self):
        """Test método edad_aproximada"""
        vacuno = Vacuno.objects.create(
            caravana="TEST001",
            raza="Test",
            sexo="M",
            fecha_nacimiento=date(2022, 1, 1),
            fecha_ingreso=date.today()
        )
        
        edad_esperada = (date.today() - date(2022, 1, 1)).days
        self.assertEqual(vacuno.edad_aproximada(), edad_esperada)
    
    def test_edad_aproximada_sin_fecha_nacimiento(self):
        """Test método edad_aproximada sin fecha de nacimiento"""
        vacuno = Vacuno.objects.create(
            caravana="TEST001",
            raza="Test",
            sexo="M",
            fecha_ingreso=date.today()
        )
        
        self.assertIsNone(vacuno.edad_aproximada())
    
    def test_is_vendido_sin_estados(self):
        """Test método is_vendido sin estados"""
        vacuno = Vacuno.objects.create(
            caravana="TEST001",
            raza="Test",
            sexo="M",
            fecha_ingreso=date.today()
        )
        
        self.assertFalse(vacuno.is_vendido())


class EstadoVacunoModelTest(TestCase):
    """Tests unitarios para el modelo EstadoVacuno"""
    
    def setUp(self):
        self.vacuno = Vacuno.objects.create(
            caravana="EST001",
            raza="Test",
            sexo="M",
            fecha_ingreso=date.today()
        )
    
    def test_estado_creation(self):
        """Test creación de estado"""
        estado = EstadoVacuno.objects.create(
            vacuno=self.vacuno,
            ciclo_productivo="ternero",
            estado_salud="sano",
            estado_general="activo"
        )
        
        self.assertEqual(estado.vacuno, self.vacuno)
        self.assertEqual(estado.ciclo_productivo, "ternero")
        self.assertEqual(estado.estado_salud, "sano")
        self.assertEqual(estado.estado_general, "activo")
        self.assertEqual(estado.fecha, date.today())
    
    def test_vacuno_estado_actual_relationship(self):
        """Test relación con método estado_actual del vacuno"""
        estado = EstadoVacuno.objects.create(
            vacuno=self.vacuno,
            estado_general="activo"
        )
        
        self.assertEqual(self.vacuno.estado_actual(), estado)
    
    def test_is_vendido_method(self):
        """Test método is_vendido del vacuno"""
        EstadoVacuno.objects.create(
            vacuno=self.vacuno,
            estado_general="vendido"
        )
        
        self.assertTrue(self.vacuno.is_vendido())


class EstadiaAnimalModelTest(TestCase):
    """Tests unitarios para el modelo EstadiaAnimal"""
    
    def setUp(self):
        self.campo = Campo.objects.create(nombre="Campo Test", ubicacion="Test")
        self.vacuno = Vacuno.objects.create(
            caravana="EST001",
            raza="Test",
            sexo="M",
            fecha_ingreso=date.today()
        )
    
    def test_estadia_creation(self):
        """Test creación de estadía"""
        estadia = EstadiaAnimal.objects.create(
            animal=self.vacuno,
            campo=self.campo,
            fecha_entrada=date(2024, 1, 1)
        )
        
        self.assertEqual(estadia.animal, self.vacuno)
        self.assertEqual(estadia.campo, self.campo)
        self.assertEqual(estadia.fecha_entrada, date(2024, 1, 1))
        self.assertIsNone(estadia.fecha_salida)
    
    def test_campo_actual_method(self):
        """Test método campo_actual del vacuno"""
        EstadiaAnimal.objects.create(
            animal=self.vacuno,
            campo=self.campo,
            fecha_entrada=date.today()
        )
        
        self.assertEqual(self.vacuno.campo_actual(), self.campo)
    
    def test_campo_capacidad_actual(self):
        """Test método capacidad_actual del campo"""
        EstadiaAnimal.objects.create(
            animal=self.vacuno,
            campo=self.campo,
            fecha_entrada=date.today()
        )
        
        self.assertEqual(self.campo.capacidad_actual(), 1)


class VacunaModelTest(TestCase):
    """Tests unitarios para el modelo Vacuna"""
    
    def test_vacuna_creation(self):
        """Test creación de vacuna"""
        vacuna = Vacuna.objects.create(
            nombre="Aftosa",
            laboratorio="BioVet Argentina"
        )
        
        self.assertEqual(vacuna.nombre, "Aftosa")
        self.assertEqual(vacuna.laboratorio, "BioVet Argentina")
        self.assertEqual(str(vacuna), "Aftosa")
    
    def test_vacuna_campos_opcionales(self):
        """Test campos opcionales"""
        vacuna = Vacuna.objects.create(nombre="Brucelosis")
        self.assertEqual(vacuna.laboratorio, "")
        self.assertEqual(vacuna.descripcion, "")


class VacunacionModelTest(TestCase):
    """Tests unitarios para el modelo Vacunacion"""
    
    def setUp(self):
        self.vacuno = Vacuno.objects.create(
            caravana="VAC001",
            raza="Test",
            sexo="M",
            fecha_ingreso=date.today()
        )
        self.vacuna = Vacuna.objects.create(nombre="Aftosa")
    
    def test_vacunacion_creation(self):
        """Test creación de vacunación"""
        vacunacion = Vacunacion.objects.create(
            animal=self.vacuno,
            vacuna=self.vacuna,
            fecha=date(2024, 2, 1)
        )
        
        self.assertEqual(vacunacion.animal, self.vacuno)
        self.assertEqual(vacunacion.vacuna, self.vacuna)
        self.assertEqual(vacunacion.fecha, date(2024, 2, 1))
    
    def test_vacunas_pendientes_method(self):
        """Test método vacunas_pendientes del vacuno"""
        # Crear otra vacuna no aplicada
        vacuna_pendiente = Vacuna.objects.create(nombre="Brucelosis")
        
        # Aplicar la primera vacuna
        Vacunacion.objects.create(
            animal=self.vacuno,
            vacuna=self.vacuna,
            fecha=date.today()
        )
        
        vacunas_pendientes = self.vacuno.vacunas_pendientes()
        self.assertIn(vacuna_pendiente, vacunas_pendientes)
        self.assertNotIn(self.vacuna, vacunas_pendientes)


class TransferenciaModelTest(TestCase):
    """Tests unitarios para el modelo Transferencia"""
    
    def setUp(self):
        self.campo_origen = Campo.objects.create(nombre="Campo Origen", ubicacion="Origen")
        self.campo_destino = Campo.objects.create(nombre="Campo Destino", ubicacion="Destino")
        self.vacuno = Vacuno.objects.create(
            caravana="TRANS001",
            raza="Test",
            sexo="M",
            fecha_ingreso=date.today()
        )
    
    def test_transferencia_creation(self):
        """Test creación de transferencia"""
        transferencia = Transferencia.objects.create(
            animal=self.vacuno,
            campo_origen=self.campo_origen,
            campo_destino=self.campo_destino,
            fecha=date(2024, 3, 1)
        )
        
        self.assertEqual(transferencia.animal, self.vacuno)
        self.assertEqual(transferencia.campo_origen, self.campo_origen)
        self.assertEqual(transferencia.campo_destino, self.campo_destino)
        self.assertEqual(transferencia.fecha, date(2024, 3, 1))


class VentaModelTest(TestCase):
    """Tests unitarios para el modelo Venta"""
    
    def setUp(self):
        self.vacuno = Vacuno.objects.create(
            caravana="VENTA001",
            raza="Test",
            sexo="M",
            fecha_ingreso=date.today()
        )
    
    def test_venta_creation(self):
        """Test creación de venta"""
        venta = Venta.objects.create(
            animal=self.vacuno,
            fecha=date(2024, 8, 1),
            comprador="Frigorífico Test",
            precio=Decimal("450000.00")
        )
        
        self.assertEqual(venta.animal, self.vacuno)
        self.assertEqual(venta.comprador, "Frigorífico Test")
        self.assertEqual(venta.precio, Decimal("450000.00"))


class PrecioMercadoModelTest(TestCase):
    """Tests unitarios para el modelo PrecioMercado"""
    
    def test_precio_creation(self):
        """Test creación de precio"""
        precio = PrecioMercado.objects.create(
            fecha=date(2024, 7, 1),
            categoria="Novillo",
            precio=Decimal("1850.00")
        )
        
        self.assertEqual(precio.fecha, date(2024, 7, 1))
        self.assertEqual(precio.categoria, "Novillo")
        self.assertEqual(precio.precio, Decimal("1850.00"))
    
    def test_precio_unique_together(self):
        """Test constraint unique_together"""
        PrecioMercado.objects.create(
            fecha=date(2024, 7, 1),
            categoria="Novillo",
            precio=Decimal("1850.00")
        )
        
        with self.assertRaises(IntegrityError):
            PrecioMercado.objects.create(
                fecha=date(2024, 7, 1),  # Misma fecha
                categoria="Novillo",     # Misma categoría
                precio=Decimal("1900.00")
            )
