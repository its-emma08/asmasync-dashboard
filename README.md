# 🫁 AsmaSync - Sistema Inteligente de Monitoreo y Predicción

**AsmaSync** es un ecosistema tecnológico integral orientado al sector salud, diseñado específicamente para el monitoreo en tiempo real y la predicción temprana de crisis asmáticas. El sistema conecta a pacientes con profesionales médicos a través de algoritmos de inteligencia artificial, asegurando una intervención oportuna.

---

## 🏗️ Arquitectura y Tecnologías

El sistema está construido bajo un enfoque moderno de capas y microservicios orientados a eventos para garantizar máxima escalabilidad, tolerancia a fallos y bajo acoplamiento.

### Interfaces de Usuario (Frontend)
- **Astro**: Landing page pública enfocada en velocidad y máxima optimización SEO.
- **Angular 17+**: Panel de control (Dashboard) clínico para administración hospitalaria, seguimiento de pacientes y gestión de intervenciones.
- **Flutter**: Aplicación móvil multiplataforma (iOS y Android) para que los pacientes registren sus datos y reciban alertas push.

### Motor y Lógica (Backend)
- **FastAPI (Python)**: API RESTful asíncrona de altísimo rendimiento para orquestación de datos médicos.
- **Scikit-learn**: Modelos predictivos de Inteligencia Artificial que calculan el nivel de riesgo de crisis del paciente.
- **Apache Kafka**: Plataforma distribuida de streaming de eventos para el manejo concurrente y en tiempo real de métricas IoT y mensajería.

### Persistencia y Nube (Bases de Datos)
- **PostgreSQL**: Base de datos relacional robusta (ACID) para historiales, usuarios y accesos médicos.
- **MongoDB**: Base de datos NoSQL para el registro de alto volumen de series de tiempo provenientes de biosensores y dispositivos IoT.
- **Firebase Cloud Messaging**: Motor de entrega de notificaciones push de baja latencia a los dispositivos móviles de los pacientes.

---

## 📂 Estructura del Proyecto

```text
asmasync-dashboard/
├── backend/          # Microservicios en FastAPI, modelos ML, scripts de DB y entorno Docker.
├── frontend/         # Código fuente del Dashboard Médico desarrollado en Angular.
├── ProyInt/          # Documentos entregables del Proyecto Integrador (Metodología, Arquitectura, Versiones).
└── README.md         # Documentación principal.
```

---

## 🚀 Instalación y Despliegue en Desarrollo

### Requisitos Previos
- [Node.js](https://nodejs.org/) (Recomendado v18+) y npm.
- [Python](https://www.python.org/) (Recomendado v3.11+).
- [Docker y Docker Compose](https://www.docker.com/) (Para bases de datos y Kafka).

### 1. Despliegue de Servicios (Bases de datos)
Levanta los contenedores en segundo plano necesarios para el proyecto:
```bash
cd backend
docker-compose up -d
```

### 2. Configurar el Backend (FastAPI)
Crea y activa tu entorno virtual, luego instala las dependencias e inicia el servidor.
```bash
cd backend
python -m venv venv

# En Windows:
.\venv\Scripts\activate
# En Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```
La API estará documentada automáticamente en `http://localhost:8000/docs`.

### 3. Configurar el Frontend (Angular Dashboard)
En una terminal nueva, instala los paquetes e inicia el servidor de desarrollo:
```bash
cd frontend
npm install
npm start
```
El panel de control médico estará disponible en `http://localhost:4200`.

---

## 🛡️ Control de Versiones (Git Workflow)
El proyecto sigue el modelo colaborativo **Feature Branch Workflow**:
- `main`: Código estable y validado para entorno de Producción.
- `develop`: Rama base de desarrollo, integración continua y pre-producción.
- `feature/*`: Ramas individuales y temporales para el desarrollo de cada nueva característica o interfaz.
- `bugfix/*`: Corrección ágil de incidencias.

---

## 👥 Metodología
Proyecto desarrollado rigurosamente bajo la metodología ágil **Scrum**, permitiendo iteraciones de valor rápidas, escalabilidad por Sprints y adaptación continua a los estrictos requerimientos de ciberseguridad médica.
