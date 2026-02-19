# AsmaSync Backend API

Backend desarrollado con **FastAPI**, **PostgreSQL** y **Redis** para el sistema de monitoreo AsmaSync.

## Características
- **FastAPI**: Alto rendimiento y documentación automática (Swagger UI).
- **PostgreSQL**: Persistencia de datos (Usuarios, Pacientes, Alertas).
- **Redis**: Caché y soporte para tareas asíncronas (futuro).
- **WebSockets**: Alertas en tiempo real.
- **ML Integration**: Predicción de riesgo de crisis (Mock implementation).
- **Seguridad**: JWT (Access/Refresh), bcrypt, validación Pydantic.
- **Compliance**: Auditoría completa (tabla `audit_logs`) para NOM-004.

## Requisitos
- Python 3.11+
- PostgreSQL
- Redis

## Instalación Local

1.  Crear entorno virtual:
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows: venv\Scripts\activate
    ```

2.  Instalar dependencias:
    ```bash
    pip install -r requirements.txt
    ```

3.  Configurar variables de entorno:
    ```bash
    cp .env.example .env
    # Editar .env con tus credenciales de BD y Redis local
    ```

4.  Ejecutar migraciones de BD:
    ```bash
    alembic upgrade head
    ```

5.  Iniciar servidor:
    ```bash
    uvicorn app.main:app --reload
    ```
    La API estará disponible en `http://localhost:8000`.
    Documentación interactiva en `http://localhost:8000/docs`.

## Despliegue con Docker

1.  Construir y levantar contenedores:
    ```bash
    docker-compose up -d --build
    ```

2.  Ejecutar migraciones en el contenedor:
    ```bash
    docker-compose exec backend alembic upgrade head
    ```

## Estructura
```
app/
├── api/             # Endpoints (v1) y dependencias
├── core/            # Configuración, Seguridad, BD
├── ml/              # Modelos y lógica de Machine Learning
├── models/          # Modelos SQLAlchemy
├── schemas/         # Esquemas Pydantic
└── services/        # Lógica de negocio encapsulada
```
