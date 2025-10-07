# Sistema de Gestión Ganadera

Sistema completo para la gestión de ganado vacuno desarrollado con Django REST Framework y React.

## Características

- Gestión de animales 
- Control de campos y ubicaciones
- Seguimiento de vacunación
- Registro de ventas
- Transferencias entre campos
- Dashboard con estadísticas

## Tecnologías

- **Backend**: Django, Django REST Framework
- **Frontend**: React, Vite, Material-UI
- **Base de datos**: PostgreSQL (SQLite para desarrollo)

## Despliegue en Render (plan gratuito)

Sigue esta guía para publicar la API de Django y el frontend de React usando únicamente la interfaz de Render, sin scripts adicionales.

### 1. Preparar repositorio y variables

1. Copia `.env.example` → `.env` dentro de `backend/` y ajusta los valores para tu entorno local si lo necesitas.
2. Copia `.env.example` → `.env.local` dentro de `frontend/` para que Vite consuma tu API local durante el desarrollo.
3. Verifica que todos los cambios estén `git push` en la rama `main` (Render leerá directamente del repositorio).

### 2. Crear la base de datos PostgreSQL en Render

1. En Render, crea un recurso **PostgreSQL** (plan "Free") y espera a que finalice el aprovisionamiento.
2. Anota el nombre del recurso; Render generará `DATABASE_URL`. Posteriormente lo vincularás al backend.

### 3. Backend (Web Service)

1. En Render crea un **Web Service** nuevo, seleccionando este repositorio y la carpeta `backend/` como raíz.
2. Configura los campos principales:
   - **Runtime**: Python 3.12 (o la última disponible estable).
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command**: `gunicorn config.wsgi:application`
3. En la sección **Environment Variables** define:
   - `SECRET_KEY`: valor seguro que solo tú conozcas.
   - `DEBUG`: `False`.
   - `ALLOWED_HOSTS`: `localhost,127.0.0.1,<TU_DOMINIO_RENDER>`.
   - `FRONTEND_URL`: URL completa (https://) del sitio frontend cuando lo tengas publicado.
   - `CORS_ALLOWED_ORIGINS`: `https://<TU_FRONTEND>,http://localhost:5173` (puedes añadir más separados por coma).
   - `CSRF_TRUSTED_ORIGINS`: `https://<TU_DOMINIO_RENDER>` (opcional, útil si en el futuro habilitas vistas con formularios).
4. En **Add Environment Variable from Database**, vincula el recurso Postgres creado; Render expondrá `DATABASE_URL` y los credenciales de forma automática.
5. Despliega el servicio. Tras el primer deploy, abre la consola **Shell** del servicio y ejecuta manualmente:
   - `python manage.py migrate`
   - `python manage.py createsuperuser` (opcional si deseas acceso al panel admin).
6. Cada deploy posterior reutilizará la base de datos Postgres vinculada.

### 4. Frontend (Static Site)

1. Crea un recurso **Static Site** en Render apuntando a este repo y selecciona la carpeta `frontend/`.
2. Define:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. En **Environment Variables** agrega:
   - `VITE_API_BASE_URL`: URL pública del backend de Render, terminada en `/api`.
4. Publica el sitio. La URL resultante deberás añadirla a `FRONTEND_URL` y `CORS_ALLOWED_ORIGINS` en el backend (Render redeployará automáticamente al guardar los cambios).

### 5. Verificaciones finales

- Comprueba que `https://<tu-frontend>` sirve la aplicación React.
- Accede desde el navegador; las peticiones deben apuntar al dominio del backend configurado.
- Revisa los logs de ambos servicios en Render ante cualquier error (por ejemplo, falta de migraciones o CORS).

Con esta configuración podrás mantener desarrollo local con SQLite y producción en Render con PostgreSQL administrado, manteniendo la seguridad mediante variables de entorno.
