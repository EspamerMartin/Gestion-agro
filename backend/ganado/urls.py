from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CampoViewSet,
    DashboardViewSet,
    EstadiaAnimalViewSet,
    EstadoVacunoViewSet,
    OpcionesViewSet,
    TransferenciaViewSet,
    VacunacionViewSet,
    VacunaViewSet,
    VacunoViewSet,
    VentaViewSet,
)

# Crear el router para las APIs
router = DefaultRouter()
router.register(r'campos', CampoViewSet, basename='campos')
router.register(r'vacunos', VacunoViewSet, basename='vacunos')
router.register(r'estados-vacuno', EstadoVacunoViewSet, basename='estados-vacuno')
router.register(r'estadias', EstadiaAnimalViewSet, basename='estadias')
router.register(r'vacunas', VacunaViewSet, basename='vacunas')
router.register(r'vacunaciones', VacunacionViewSet, basename='vacunaciones')
router.register(r'transferencias', TransferenciaViewSet, basename='transferencias')
router.register(r'ventas', VentaViewSet, basename='ventas')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'opciones', OpcionesViewSet, basename='opciones')

urlpatterns = [
    path('api/', include(router.urls)),
]
