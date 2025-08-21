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
router.register(r'campos', CampoViewSet)
router.register(r'vacunos', VacunoViewSet)
router.register(r'estados-vacuno', EstadoVacunoViewSet)
router.register(r'estadias', EstadiaAnimalViewSet)
router.register(r'vacunas', VacunaViewSet)
router.register(r'vacunaciones', VacunacionViewSet)
router.register(r'transferencias', TransferenciaViewSet)
router.register(r'ventas', VentaViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'opciones', OpcionesViewSet, basename='opciones')

urlpatterns = [
    path('api/', include(router.urls)),
]
