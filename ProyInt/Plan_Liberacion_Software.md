# PLAN DE LIBERACIÓN DE SOFTWARE (ACTIVIDAD 8)
### UNIVERSIDAD TECNOLÓGICA DEL CENTRO DE VERACRUZ (UTCV)
**Área:** Tecnologías de la Información — Desarrollo de Software Multiplataforma  
**Proyecto Integrador:** AsmaSync (Monitoreo Clínico y Predicción del Asma)  
**Materia:** Proyecto Integrador — Segundo Parcial  
**Ubicación:** Cuitláhuac, Veracruz, México  
**Estatus:** Plan Aprobado y Homologado  

---

## 🔍 RESUMEN EJECUTIVO

Este documento define el **Plan de Liberación de Software** para el ecosistema **AsmaSync**, desarrollado en la **Universidad Tecnológica del Centro de Veracruz (UTCV)**. El propósito de este plan es estructurar el ciclo completo de empaquetado, distribución, aseguramiento y despliegue del sistema (compuesto por el Dashboard Web en Angular 17, la App Móvil en Flutter y la API de Servicios en FastAPI), garantizando que cada incremento de código cumpla con los estándares internacionales de ingeniería de software, las regulaciones locales sobre el expediente clínico electrónico en México (NOM-004-SSA3-2012) y las normativas mundiales de confidencialidad de datos médicos (HIPAA/GDPR).

---

## 🛠️ 1. POLÍTICAS COMUNES QUE RESPALDAN EL PLAN

Para asegurar una transición controlada, predecible y libre de fallos entre los diferentes entornos (Desarrollo, Staging y Producción), se establecen las siguientes políticas operativas obligatorias:

### A. Política de Control de Cambios y Ramas (Git Branching Policy)
*   **Modelo de Ramas (GitFlow Simplificado):**
    *   `main`: Contiene el código oficial y estable desplegado en producción. Cada versión liberada se etiqueta mediante una tag criptográfica (`vX.Y.Z`).
    *   `develop`: Rama de integración donde se consolidan las funcionalidades validadas por QA.
    *   `feature/*`: Ramas efímeras creadas para el desarrollo de nuevas historias de usuario (ej. `feature/websocket-alerts`).
    *   `bugfix/*`: Ramas dedicadas exclusivamente a la resolución de errores detectados en Staging.
*   **Criterio de Integración (Merge Criteria):** Queda estrictamente prohibido realizar commits directos en `develop` o `main`. Todo cambio debe enviarse mediante una Pull Request (PR) hacia `develop`. Para ser aprobada, la PR debe:
    1. Obtener la aprobación obligatoria de al menos un desarrollador senior (revisión de código por pares).
    2. Pasar exitosamente las pruebas automáticas del pipeline de CI/CD (compilación limpia y cero fallos en linter).
    3. No introducir conflictos de fusión con la rama de destino.

### B. Política de Calidad de Código y Pruebas
*   **Compilación Limpia:** Ningún entregable será elegible para empaquetado si presenta errores sintácticos, de tipado (TypeScript estricto en Angular) o alertas críticas de linter.
*   **Cobertura Mínima de Pruebas (Test Coverage):**
    *   **Frontend (Angular):** Cobertura de pruebas unitarias mínima del **80%** medida a través de la herramienta integrada de Vitest.
    *   **Backend (FastAPI):** Cobertura de pruebas unitarias y de integración mínima del **85%** sobre los controladores de negocio, SQLAlchemy ORM y utilidades clínicas.
*   **Validación del Modelo Predictivo (Machine Learning):** Debido al impacto clínico de las alertas, el clasificador de riesgo (Scikit-Learn) debe validar una exactitud (accuracy score) superior al **90%** en el conjunto de test antes de empaquetarse para su liberación.

### C. Política de Seguridad y Privacidad Clínica (NOM-004 & HIPAA)
*   **Análisis Estático de Seguridad (SAST):** El pipeline de integración continua analiza de forma estática el código para detectar credenciales quemadas, inyecciones de SQL o vulnerabilidades XSS.
*   **Cifrado Obligatorio:** Todos los datos clínicos persistidos (oximetría SpO2, PEF) deben ser cifrados en tránsito mediante HTTPS con **TLS 1.3** y en reposo aplicando cifrado **AES-256** en el almacenamiento local del cliente.
*   **Higiene de Dependencias:** Bloqueo de liberación en caso de detectarse vulnerabilidades conocidas (CVE) con severidad Alta o Crítica en las librerías declaradas en `requirements.txt` o `package.json`.

### D. Política de Despliegue y Reversión (Rollback Protocol)
*   **Automatización sin Intervención Manual:** Los despliegues se inician automáticamente tras la aprobación de la PR en la rama correspondiente, eliminando configuraciones manuales propensas a errores.
*   **Respaldos Previos al Despliegue:** Antes de aplicar migraciones de esquema de base de datos (Alembic/PostgreSQL), se ejecuta un respaldo automatizado mediante `pg_dump`:
    ```bash
    pg_dump -U postgres -d asmasync_prod -F c -b -v -f /backups/asmasync_before_release.backup
    ```
*   **Ventana de Rollback:** Se establece un periodo de observación de **60 minutos** post-despliegue. Si se reporta degradación crítica del sistema (errores HTTP 500 continuos, desconexión de sockets o caídas del sensor IoT), el pipeline automatizado revierte el despliegue a la imagen de producción anterior (`release-previous`) en menos de 10 minutos.

---

## 📋 2. NORMATIVAS Y ESTÁNDARES REGULADORES

El desarrollo, control de versiones y liberación de AsmaSync se rige por un marco de ingeniería y regulaciones de salud:

### A. Estándares de Proceso de Software
*   **ISO/IEC 12207 (Procesos del Ciclo de Vida del Software):** Estructura el proyecto en base a procesos primarios (desarrollo e integración de código), procesos de soporte (gestión de configuración mediante tags de Git y aseguramiento de calidad) y procesos organizacionales (planeación de releases).
*   **ISO/IEC 25010 (Calidad del Producto de Software):** Asegura que el software cumpla con factores de seguridad (cifrado de PHI), fiabilidad (resiliencia del WebSocket y reconexión exponencial), y usabilidad (adaptabilidad del Dashboard para médicos y la app móvil).

### B. Control de Versiones Semántico (SemVer 2.0.0)
El versionamiento de las imágenes Docker y entregables sigue el formato `MAJOR.MINOR.PATCH` (ej. `v2.1.4`):
*   **MAJOR (Mayor):** Cambios de arquitectura incompatibles con versiones previas (ej. redefinición del protocolo de ingesta del biosensor IoT).
*   **MINOR (Menor):** Inclusión de nuevas funcionalidades totalmente compatibles (ej. exportación de nuevos reportes a PDF).
*   **PATCH (Parche):** Correcciones menores de bugs o vulnerabilidades de seguridad (ej. corrección del validador de XSS).

### C. Normativas Legales de Datos Médicos
*   **NOM-004-SSA3-2012 (Expediente Clínico Electrónico en México):** Regula la confidencialidad, almacenamiento de datos históricos por un periodo mínimo legal, y control de accesos de profesionales en territorio nacional.
*   **HIPAA & GDPR:** Normas internacionales que garantizan el consentimiento informado del paciente, la portabilidad de sus lecturas de oximetría y la anonimización de datos en conjuntos de entrenamiento de IA.

---

## ⚙️ 3. HERRAMIENTAS DE LIBERACIÓN DE SOFTWARE Y JUSTIFICACIÓN

Para dar soporte técnico a las políticas y normativas descritas, se ha seleccionado el siguiente stack de herramientas de liberación:

| Herramienta | Función en el Proyecto | Justificación Técnica y Operativa |
| :--- | :--- | :--- |
| **Git & GitHub** | Control de versiones distribuido y almacenamiento del repositorio. | Facilita el trabajo cooperativo, la auditoría del historial mediante commits y la integración nativa de políticas de ramas protegidas en GitHub. |
| **GitHub Actions** | Motor de Integración y Despliegue Continuo (CI/CD). | Ejecuta de forma asíncrona la suite de pruebas unitarias (`Vitest` y `Pytest`) e inspecciones de linter en cada commit/PR. |
| **Docker & Docker Compose** | Virtualización ligera de servicios y microservicios. | Asegura la portabilidad y homogeneidad del backend FastAPI y la base de datos PostgreSQL, garantizando compilaciones reproducibles. |
| **Angular CLI** | Compilador y optimizador de la aplicación web. | Realiza el empaquetado optimizado del frontend utilizando *Ahead-of-Time (AOT)* compilación y *Tree Shaking* para pantallas rápidas. |
| **Vercel** | Hosting global para la aplicación de Angular 17. | Aloja el frontend en servidores Edge perimetrales, optimizando la velocidad de carga y administrando de forma autónoma certificados SSL. |
| **Render** | Alojamiento para la API REST FastAPI y base PostgreSQL. | Provee integración directa con GitHub para el despliegue automático de contenedores Docker, gestión de variables de entorno seguras e HTTPS TLS 1.3. |

---

## 📅 4. CRONOGRAMA DE ETAPAS DE PUBLICACIÓN Y CORRECCIÓN DE ERRORES

El proceso de liberación de software de AsmaSync se divide en **4 etapas secuenciales**, cada una con ventanas dedicadas obligatoriamente a la estabilización y remediación de errores:

```
[ Fase 1: Alpha (Local/Tests) ]  ---> [ Ventana de Corrección: 5 días (Errores de lógica) ]
               │
               ▼
[ Fase 2: Beta (Staging/Kafka) ] ---> [ Ventana de Corrección: 7 días (Integración y Bugs de red) ]
               │
               ▼
[ Fase 3: Release Candidate (RC) ] -> [ Ventana de Corrección: 4 días (Bugs Críticos de Seguridad/Blockers) ]
               │
               ▼
[ Fase 4: Producción (Go-Live) ]  --> [ Ventana de Corrección: 3 días (Monitoreo de telemetría y Hotfixes) ]
```

### Detalle de las Etapas y Hitos de Liberación:

#### Etapa 1: Fase Alpha (Entorno Local y Pruebas Unitarias)
*   **Objetivo:** Validar la lógica aislada de los componentes del Dashboard, las rutas del API FastAPI y la precisión del modelo predictivo.
*   **Actividades:** Ejecución de pruebas unitarias locales (`ng test` / `pytest`), pruebas de caja blanca en endpoints de datos de biosensores y revisión estática de código.
*   **Criterio de Aceptación:** 100% de las pruebas unitarias aprobadas. Cobertura de código >= 80% en frontend y >= 85% en backend.
*   **Ventana para Corrección de Errores:** **5 días**. Los desarrolladores resuelven de forma prioritaria los fallos de lógica y compilación locales antes de solicitar la fusión de ramas en `develop`.

#### Etapa 2: Fase Beta (Entorno de Integración y Pruebas de Sistema)
*   **Objetivo:** Probar la integración real entre el Dashboard frontend, el backend y los simuladores/dispositivos físicos de espirometría en staging.
*   **Actividades:** Despliegue en entorno de staging, pruebas de integración de base de datos, pruebas de carga en flujos de Kafka, y pruebas de concurrencia.
*   **Criterio de Aceptación:** Conexión estable con PostgreSQL/Supabase. Los WebSocket deben mantener comunicación ininterrumpida por más de 12 horas bajo carga simulada.
*   **Ventana para Corrección de Errores:** **7 días**. Los bugs encontrados se registran en GitHub Issues y se resuelven en ramas `bugfix/*` antes de congelar el código.

#### Etapa 3: Candidato de Liberación (Release Candidate - RC)
*   **Objetivo:** Validar el sistema en condiciones idénticas a producción con usuarios finales de control (médicos y pacientes piloto).
*   **Actividades:** Pruebas de Aceptación del Usuario (UAT), auditoría final de seguridad de datos, simulacros de pérdida de conectividad y pruebas de recuperación ante fallos.
*   **Criterio de Aceptación:** Cero bugs críticos abiertos (Severity 1 - Blockers). Aprobación firmada por el líder clínico del proyecto piloto.
*   **Ventana para Corrección de Errores:** **4 días**. Solo se permiten correcciones de bugs críticos de estabilidad o seguridad. Si se requiere una corrección, se genera una subversión (ej. `v2.1.4-rc2`).

#### Etapa 4: Producción y Lanzamiento (Go-Live)
*   **Objetivo:** Liberación oficial del ecosistema AsmaSync para su uso en producción.
*   **Actividades:** Ejecución de migraciones de base de datos, despliegue automatizado del contenedor final en Render/Vercel, pruebas de humo rápidas posteriores al despliegue.
*   **Ventana para Corrección de Errores (Monitoreo y Estabilización):** **3 días** dedicados a la resolución de incidencias en producción (Hotfixes) y monitoreo de telemetría, asignando personal de guardia permanente para asegurar la alta disponibilidad del servicio clínico.
