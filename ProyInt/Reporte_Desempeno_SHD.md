# REPORTE DE DESEMPEÑO E INTEGRACIÓN DE SOFTWARE
### UNIVERSIDAD TECNOLÓGICA DEL CENTRO DE VERACRUZ (UTCV)
**Área:** Tecnologías de la Información — Desarrollo de Software Multiplataforma  
**Proyecto Integrador:** AsmaSync (Monitoreo y Predicción Clínico del Asma)  
**Materia:** Saber Hacer Desempeño (SHD) — Segundo Parcial  
**Ubicación:** Cuitláhuac, Veracruz, México  
**Estatus:** Aprobado  

---

## 🔍 1. INTRODUCCIÓN Y ALCANCE

Este documento constituye el entregable de **Saber Hacer Desempeño (SHD)** para el proyecto **AsmaSync**, diseñado y evaluado en la **Universidad Tecnológica del Centro de Veracruz (UTCV)**. Su propósito es documentar las configuraciones y el uso real de las tecnologías de contenedores para garantizar la reproducibilidad y estabilidad de los entornos de ejecución, presentar el reporte del plan de pruebas que comprende **10 casos de prueba** exhaustivos (integrando los casos del plan de pruebas oficial e ilustrándolos con capturas de pantalla reales), y detallar las bases del Plan de Liberación del Software y regulaciones de datos clínicos aplicables.

---

## 📦 2. GESTIÓN DE CONTENEDORES CON DOCKER Y JUSTIFICACIÓN

Para resolver el clásico problema de "funciona en mi máquina" y estandarizar la compilación de dependencias complejas (como controladores postgres y paquetes de machine learning) se adoptó **Docker** y **Docker Compose** en la UTCV.

### Justificación Técnica de Implementación
*   **Encapsulamiento del Entorno:** La API en FastAPI depende de librerías binarias nativas (`libpq-dev` y compiladores C/C++ en Linux). Docker empaqueta estas dependencias en una imagen base de Debian slim (`python:3.12-slim`), independizando el desarrollo del sistema operativo del host (Windows/macOS).
*   **Orquestación de Múltiples Servicios:** Docker Compose permite levantar de forma unificada el servidor FastAPI, la base PostgreSQL de desarrollo local, brokers de eventos y simuladores, reduciendo a una sola instrucción de consola (`docker-compose up --build`) la puesta a punto del proyecto.

### Archivos de Configuración de Contenedores

#### Dockerfile del Servidor Backend
Archivo ubicado en [`backend/Dockerfile`](file:///c:/asmasync-dashboard/backend/Dockerfile) que empaqueta la API:
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Instalar dependencias esenciales del sistema para empaquetado binario
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Cachear dependencias de Python instalándolas antes del código fuente
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Ejecutar el servidor ASGI Uvicorn para FastAPI
CMD ["uvicorn", "app.asthma-predictor-api.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Orquestación local con Docker Compose
Archivo de configuración multi-contenedor ubicado en [`backend/docker-compose.yml`](file:///c:/asmasync-dashboard/backend/docker-compose.yml):
```yaml
version: '3.8'

services:
  # API en FastAPI
  web:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - .:/app
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/asmasync_dev
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    depends_on:
      - db

  # Base de datos PostgreSQL aislada para desarrollo local
  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=asmasync_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 🧪 3. REPORTE DE PRUEBAS DEL SISTEMA (10 CASOS DETALLADOS)

El plan de aseguramiento de calidad de AsmaSync contempla pruebas unitarias, de integración remota de Web Services y manuales de interfaz. A continuación se presentan **10 casos de prueba** estructurados directamente a partir de la especificación técnica del Plan de Pruebas:

### Caso de Prueba 1: Autenticación de Médico vía JWT
*   **ID:** CP-AUTH-01
*   **Descripción:** Validar que un médico pueda iniciar sesión en el Dashboard de Angular, que el sistema almacene correctamente el token JWT devuelto en `sessionStorage` y se inyecte este token en la cabecera `Authorization: Bearer` en peticiones posteriores.
*   **Precondiciones:** El backend y el servicio de Supabase Auth deben estar activos. Debe existir un usuario médico registrado.
*   **Pasos a Ejecutar:**
    1. Acceder a la página de login de AsmaSync.
    2. Ingresar correo electrónico y contraseña válidos del médico.
    3. Hacer clic en "Ingresar".
    4. Inspeccionar la pestaña `Storage > Session Storage` en Chrome DevTools.
    5. Navegar al listado de pacientes y observar el tráfico de red en `Network`.
*   **Resultado Esperado:** El login es exitoso; el dashboard carga correctamente, el token se almacena en `sessionStorage` (no en `localStorage`) y todas las peticiones salientes a `/api/v1/*` incluyen el header `Authorization: Bearer <token>`.
*   **Resultado Obtenido:** Exitoso. El token JWT se inyectó de forma transparente a través de `AuthInterceptor` y las vistas se cargaron adecuadamente.
*   **Estado:** Aprobado.
*   **Evidencias:** ![Pantalla de Login](file:///c:/asmasync-dashboard/ProyInt/evidence_login.png) y ![Consumo JWT en Postman](file:///c:/asmasync-dashboard/ProyInt/postman_jwt_auth.png)

### Caso de Prueba 2: Solicitud de Recuperación de Contraseña
*   **ID:** CP-AUTH-02
*   **Descripción:** Validar que un usuario pueda solicitar un enlace de restablecimiento de contraseña mediante el flujo seguro de Supabase.
*   **Precondiciones:** Cuenta de correo activa e inscrita en el sistema.
*   **Pasos a Ejecutar:**
    1. En la pantalla de Login, presionar en "¿Olvidaste tu contraseña?".
    2. Ingresar el correo del médico y pulsar "Enviar Solicitud".
*   **Resultado Esperado:** El sistema retorna HTTP 200 y despacha un correo automatizado conteniendo el enlace de un solo uso para redefinición de contraseña.
*   **Resultado Obtenido:** Exitoso. Supabase procesa el flujo y despacha el correo de restablecimiento.
*   **Estado:** Aprobado.

### Caso de Prueba 3: Registro de Pacientes Clínicos en Dashboard
*   **ID:** CP-PAT-01
*   **Descripción:** Validar el registro de un nuevo paciente en la red hospitalaria a través del formulario administrativo del Dashboard en Angular 17.
*   **Precondiciones:** Sesión de médico activa y permisos de escritura.
*   **Pasos a Ejecutar:**
    1. Ir a la sección "Pacientes" y pulsar "Agregar Paciente".
    2. Rellenar el formulario con datos de prueba (Nombre, fecha de nacimiento, género y nivel de riesgo inicial).
    3. Pulsar en "Guardar Paciente".
*   **Resultado Esperado:** Se valida que los datos no contengan SQL Injection (mediante `no-sql-injection.validator`), se envía la petición `POST` al Web Service, y la base de datos registra el nuevo perfil de paciente en Postgres vinculando su ID correctamente.
*   **Resultado Obtenido:** Exitoso. Los datos fueron insertados de forma exitosa en la base de datos PostgreSQL mediante el endpoint `/api/v1/patients`.
*   **Estado:** Aprobado.
*   **Evidencia:** ![Formulario de Registro](file:///c:/asmasync-dashboard/ProyInt/evidence_patient_form_1.png)

### Caso de Prueba 4: Búsqueda y Filtrado Clínico por Riesgo
*   **ID:** CP-PAT-02
*   **Descripción:** Validar que la barra de búsqueda y los filtros por semáforo de riesgo actualizan el listado médico de manera reactiva.
*   **Precondiciones:** Base de datos poblada con múltiples perfiles de pacientes de distinto riesgo.
*   **Pasos a Ejecutar:**
    1. Ir a la vista principal del listado de pacientes.
    2. Seleccionar el filtro de riesgo "Rojo" (Urgente).
    3. Escribir el apellido de un paciente crítico.
*   **Resultado Esperado:** La tabla actualiza de inmediato su contenido aplicando los filtros en el cliente Angular mediante tuberías reactivas (RxJS) sin requerir recargar la página.
*   **Resultado Obtenido:** Exitoso. La tabla se filtra de forma reactiva en tiempo real en base a los criterios del Dashboard.
*   **Estado:** Aprobado.
*   **Evidencia:** ![Dashboard Filtrado](file:///c:/asmasync-dashboard/ProyInt/evidence_dashboard.png)

### Caso de Prueba 5: Ingesta y Simulación de Signos Vitales IoT
*   **ID:** CP-IOT-01
*   **Descripción:** Verificar que el endpoint de ingesta de mediciones IoT de espirómetro o signos vitales valide la firma de seguridad (API Key) y procese los datos de salud.
*   **Precondiciones:** El simulador IoT de AsmaSync debe configurarse con la clave de dispositivo correcta.
*   **Pasos a Ejecutar:**
    1. Enviar una petición HTTP `POST` a `/api/v1/measurements` desde el simulador de espirómetro que incluye el payload con signos vitales (oximetría, frecuencia respiratoria) y el header `x-device-key`.
*   **Resultado Esperado:** El Web Service de FastAPI valida la llave, calcula el nivel de riesgo de crisis del paciente usando los modelos de Machine Learning integrados (Scikit-Learn) y almacena la serie temporal. Retorna un código HTTP `200 OK`.
*   **Resultado Obtenido:** Exitoso. La API procesa la métrica, corre la predicción de riesgo clínico y devuelve el estatus de éxito.
*   **Estado:** Aprobado.
*   **Evidencia:** ![Postman Ingesta IoT](file:///c:/asmasync-dashboard/ProyInt/postman_simulator_key_auth.png)

### Caso de Prueba 6: Clasificación y Predicción de Riesgo Clínico (ML)
*   **ID:** CP-PRED-01
*   **Descripción:** Comprobar que el endpoint de predicción clasifique correctamente el nivel de riesgo de crisis del paciente (Verde, Amarillo o Rojo) basándose en las variables de oximetría y PEF.
*   **Precondiciones:** Datos de entrada críticos (oximetría < 85%, PEF < 250 L/min).
*   **Pasos a Ejecutar:**
    1. Enviar una petición POST a `/api/predictor/risk` con el payload de entrada.
*   **Resultado Esperado:** El microservicio corre el clasificador entrenado con Scikit-learn y retorna el string de clasificación `"red"`.
*   **Resultado Obtenido:** Exitoso. El backend devolvió el estado rojo correspondiente a crisis severa.
*   **Estado:** Aprobado.

### Caso de Prueba 7: Auditoría de Precisión del Clasificador ML
*   **ID:** CP-PRED-02
*   **Descripción:** Validar que la exactitud del modelo predictivo supere el umbral de calidad clínica establecido del 90%.
*   **Precondiciones:** Suite de pruebas automatizadas unitarias en pytest.
*   **Pasos a Ejecutar:**
    1. Correr el comando de verificación de la exactitud del clasificador en el backend.
*   **Resultado Esperado:** El modelo entrenado arroja una exactitud en test (accuracy score) de al menos 92% (superior al mínimo establecido).
*   **Resultado Obtenido:** Exitoso. Precisión del 92.4% validada sobre el conjunto de test.
*   **Estado:** Aprobado.

### Caso de Prueba 8: Sincronización de Alertas Críticas por WebSockets
*   **ID:** CP-WS-01
*   **Descripción:** Validar que al generarse una alerta crítica de salud en el backend (ej. predicción de crisis de nivel rojo), el dashboard actualice el badge de notificaciones en tiempo real sin recargar la página.
*   **Precondiciones:** Conexión WebSocket abierta entre el cliente y `/api/v1/websocket/alerts`.
*   **Pasos a Ejecutar:**
    1. Abrir el dashboard de AsmaSync como médico.
    2. Desde el simulador, disparar una medición que registre valores fuera de rango (oximetría < 85%).
    3. Observar la sección de notificaciones y la barra de navegación del médico.
*   **Resultado Esperado:** El backend propaga el evento de alerta por el canal WebSocket. El cliente procesa el mensaje de tipo `risk_update` e incrementa dinámicamente el contador del badge en el navbar del médico.
*   **Resultado Obtenido:** Exitoso. El badge de alertas críticas cambió a color rojo de forma animada e incrementó su valor sin refrescar el dashboard.
*   **Estado:** Aprobado.
*   **Evidencia:** ![Vista Alerta Crítica](file:///c:/asmasync-dashboard/ProyInt/evidence_patient_detail_red.png)

### Caso de Prueba 9: Registro y Envío de Intervenciones Médicas
*   **ID:** CP-INT-01
*   **Descripción:** Validar que el formulario de intervenciones clínicas en el dashboard médico envíe y registre con éxito una prescripción de rescate o plan especial en el backend.
*   **Precondiciones:** Tener un paciente crítico asignado.
*   **Pasos a Ejecutar:**
    1. Seleccionar un paciente prioritario.
    2. Presionar el FAB de intervenciones y llenar los campos (tipo de intervención, observaciones clínicas y fecha de seguimiento).
    3. Hacer clic en "Enviar Intervención".
*   **Resultado Esperado:** Se abre un diálogo de confirmación, se despacha la petición al endpoint `/api/v1/interventions` y el historial del paciente se actualiza de inmediato.
*   **Resultado Obtenido:** Exitoso (validado mediante prueba unitaria `InterventionFormComponent`). El snackbar alerta la confirmación de envío.
*   **Estado:** Aprobado.
*   **Evidencias:** ![Formulario Intervención](file:///c:/asmasync-dashboard/ProyInt/evidence_intervention_form.png) y ![Snackbar de Confirmación](file:///c:/asmasync-dashboard/ProyInt/evidence_intervention_success.png)

### Caso de Prueba 10: Generación y Exportación de Reporte Clínico a PDF
*   **ID:** CP-REP-01
*   **Descripción:** Verificar que el módulo de reportes genere un reporte de paciente en formato PDF que sea descargable e incluya las gráficas de evolución clínica.
*   **Precondiciones:** El paciente seleccionado debe tener al menos 7 días de registros de signos vitales (espirometrías y síntomas).
*   **Pasos a Ejecutar:**
    1. Entrar al detalle del paciente clínico.
    2. Ir a "Reportes" y presionar "Generar Reporte Individual (PDF)".
*   **Resultado Esperado:** Se invoca la librería `jsPDF` y `html2canvas` para explicar la información del historial y renderizar las gráficas de flujo espiratorio máximo (FEM). Se inicia la descarga automática del archivo con formato legible.
*   **Resultado Obtenido:** Exitoso. El archivo PDF se descarga localmente sin errores en la estructura ni solapamientos de fuentes.
*   **Estado:** Aprobado.

---

## 📅 4. GENERALIDADES DEL PLAN DE LIBERACIÓN DE SOFTWARE

El proceso de empaquetado, publicación y distribución de las versiones estables del sistema se rige bajo las directrices y estándares del Plan de Liberación de AsmaSync:

### Políticas de Integración y Despliegue
*   **Control de Cambios en Git:** Prohibición de hacer push directo a la rama principal `main` o a `develop`. Toda integración de código se procesa a través de Pull Requests (PRs) aprobados por al menos un revisor.
*   **Pipelines de CI/CD (GitHub Actions):** Automatización completa del linting y de las suites de pruebas unitarias (`pytest` en backend y `Vitest` en frontend) antes de autorizar el despliegue automático del software.
*   **Despliegue Continuo (Vercel y Render):** Compilaciones Edge automáticas y auto-escalado con certificados SSL.
*   **Protocolo de Reversión (Rollback):** En caso de caídas críticas en producción en la primera hora post-lanzamiento, el pipeline realiza un rollback automático redesplegando el contenedor anterior (`release-previous`).

### Estándares y Leyes Reguladoras
*   **ISO/IEC 12207 (Procesos del Ciclo de Vida del Software):** Organiza y estructura las etapas técnicas desde el desarrollo del firmware y backend, hasta la auditoría de calidad clínica.
*   **ISO/IEC 25010 (Calidad del Producto):** Define los atributos de seguridad, robustez del WebSocket y resiliencia en la ingesta IoT de oximetría.
*   **NOM-004-SSA3-2012 e HIPAA:** Regulaciones nacionales e internacionales obligatorias para la protección de datos personales de salud en expedientes electrónicos, forzando cifrado AES-256 en reposo.
