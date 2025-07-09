# Sistema de Gestión Ganadera

Sistema completo para la gestión de ganado vacuno desarrollado con Django REST Framework y React.

## Características

- Gestión de animales con número de caravana
- Control de campos y ubicaciones
- Seguimiento de vacunación
- Registro de ventas
- Transferencias entre campos
- Dashboard con estadísticas

## Tecnologías

- **Backend**: Django, Django REST Framework
- **Frontend**: React, Vite, Material-UI
- **Base de datos**: PostgreSQL (SQLite para desarrollo)

## Instalación

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver