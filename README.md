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

## Despliegue en Render con Docker (plan gratuito)

El repositorio ya incluye Dockerfiles separados para backend (`backend/Dockerfile`) y frontend (`frontend/Dockerfile`). Render puede construir imágenes directamente desde cada carpeta sin guiones adicionales.

### Blueprint `render.yaml`

Si prefieres automatizar la creación de servicios, usa el archivo `render.yaml` ubicado en la raíz del repositorio:

1. En Render, ve a **Blueprints** → **New Blueprint Instance** y apunta al repositorio en GitHub.
2. Render detectará la base de datos Postgres y los dos servicios web definidos en el blueprint.
3. Ajusta los valores marcados como `<tu-frontend>` o los dominios por defecto (`gestion-agro-backend.onrender.com`) antes o después del primer deploy; puedes editarlos desde la sección **Environment** de cada servicio.
4. Completa la provisión. Render construirá las imágenes Docker utilizando los Dockerfiles existentes.

### ¿Por qué Gunicorn y Whitenoise?

- **Gunicorn** es un servidor WSGI ligero y probado para Django. Render espera que la aplicación escuche en el puerto que expone (`PORT`); Gunicorn permite atender múltiples peticiones concurrentes en el contenedor sin usar `runserver`, que solo es apropiado para desarrollo.
- **Whitenoise** sirve los archivos estáticos que `collectstatic` genera dentro del contenedor. Así evitas un CDN externo y mantienes un despliegue simple (ideal para el plan gratuito) sin depender de almacenamiento adicional.

### 1. Preparar variables y repo

1. Copia `backend/.env.example` → `backend/.env` si deseas probar localmente.
2. Copia `frontend/.env.example` → `frontend/.env.local` para que Vite apunte a tu API local durante el desarrollo.
3. Asegúrate de subir los cambios a la rama que Render consumirá (por ejemplo, `main`).

### 2. Crear la base de datos PostgreSQL

1. En Render, crea un recurso **PostgreSQL** (plan "Free").
2. Cuando termine, toma el valor de `DATABASE_URL`; Render lo inyectará después en el servicio backend al vincular la base de datos.

### 3. Backend (Web Service Docker)

1. Crea un nuevo **Web Service** y selecciona el repositorio con la subcarpeta `backend/` como raíz.
2. Indica que Render utilice el `Dockerfile` existente. No es necesario definir comandos de build/start manuales; Render ejecutará lo indicado en el Dockerfile.
3. Define las variables de entorno obligatorias en Render:
   - `SECRET_KEY`: genera un valor seguro.
   - `DEBUG`: `False` en producción.
   - `ALLOWED_HOSTS`: incluye `localhost,127.0.0.1` y el dominio que Render asigne (lo verás tras el primer deploy).
   - `FRONTEND_URL`: la URL HTTPS del frontend cuando esté listo.
   - `CORS_ALLOWED_ORIGINS`: lista separada por comas con el dominio del frontend y, si quieres, tus dominios locales (`http://localhost:5173`, etc.).
   - `CSRF_TRUSTED_ORIGINS`: al menos `https://<tu-dominio-backend.onrender.com>`.
4. En **Add Environment Variable from Database**, vincula la instancia de Postgres creada; Render añadirá automáticamente `DATABASE_URL` y credenciales conexas.
5. Lanza el deploy. Tras completarse, abre la consola **Shell** del servicio y ejecuta manualmente:
   - `python manage.py migrate`
   - `python manage.py createsuperuser` (opcional).

> **Nota sobre dominios:** mantener frontend y backend como servicios separados en Render simplifica monitoreo y escalado. El plan gratuito permite varios servicios, aunque pueden "hibernar" tras períodos de inactividad.

### 4. Frontend (Web Service Docker con Node)

1. Crea otro **Web Service** apuntando a la carpeta `frontend/` del mismo repositorio.
2. Selecciona el `Dockerfile` incluido. El contenedor compila la app con Vite y la sirve usando `vite preview`, que requiere Node en tiempo de ejecución (útil cuando no se quiere un hosting estático puro).
3. Configura las variables de entorno:
   - `VITE_API_BASE_URL`: URL pública del backend terminada en `/api`.
4. Render detectará el puerto expuesto y conectará el tráfico entrante al puerto que la app escuche (`PORT`).

### 5. Ajustes de CORS y verificación

- Después de obtener la URL definitiva del frontend, actualiza `FRONTEND_URL` y añade el dominio a `CORS_ALLOWED_ORIGINS` en el backend desde el panel de Render. El servicio se redeployará automáticamente.
- Comprueba los logs de ambos servicios si observas errores de CORS, autenticación o de conexión a la base.
- Recuerda repetir `python manage.py migrate` cuando introduzcas nuevos modelos.

Con esta arquitectura obtienes un despliegue completamente contenedorizado, con Postgres gestionado por Render, backend y frontend aislados pero comunicándose vía HTTPS.
