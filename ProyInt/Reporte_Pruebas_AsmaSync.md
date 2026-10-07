# Universidad Tecnológica del Centro de Veracruz (UTCV)
**Proyecto Integrador — AsmaSync**
*Sistema de Monitoreo Clínico y Predicción de Crisis Asmáticas*
*Estrategia de Pruebas, Diseño de Casos de Prueba, Reporte de Errores y Reejecución*

---

# REPORTE DE PRUEBAS DE SOFTWARE (ACTIVIDAD 7)

## 1. Plan de Pruebas (Estrategia y Herramientas)

El aseguramiento de la calidad (QA) del sistema AsmaSync se diseñó utilizando un enfoque multinivel, combinando pruebas automatizadas de código con pruebas funcionales manuales e integrales. Esto garantiza la integridad de los datos médicos recopilados, la resiliencia de la interfaz del Dashboard frente a fallos de red y la correcta entrega de alertas de salud en tiempo real.

### 1.1 Justificación del Tipo de Pruebas

Para validar el sistema completo se determinó realizar tres categorías de pruebas:

*   **Pruebas Unitarias y de Componentes (Frontend & Backend):** 
    *   *Objetivo:* Asegurar que cada módulo aislado de lógica y cada componente visual independiente responda a las condiciones de frontera de manera correcta y rápida.
    *   *Justificación:* El dashboard médico en Angular y la API de predicción de crisis asmáticas en FastAPI contienen lógica sensible (como el cálculo del IMC, mapeo de rangos de riesgo verde/amarillo/rojo, o interceptores de resiliencia de red). Aislar estas unidades previene regresiones al modificar el código base.
*   **Pruebas de Integración y Servicios Web (M2M / API):**
    *   *Objetivo:* Validar la comunicación remota, el flujo de datos relacional y las restricciones de acceso por rol entre el cliente y el servidor.
    *   *Justificación:* AsmaSync requiere la sincronización constante de biosensores IoT simulados enviando datos periódicos del paciente hacia FastAPI, persistiendo los datos en PostgreSQL e interactuando con la base documental. Estas pruebas confirman que los endpoints interactúan adecuadamente bajo esquemas de seguridad estrictos.
*   **Pruebas Manuales Funcionales y de Aceptación (End-to-End):**
    *   *Objetivo:* Simular los flujos de trabajo de un médico clínico real (ej. registrar pacientes, consultar historial, emitir planes de acción en semáforo, y descargar reportes PDF).
    *   *Justificación:* Hay aspectos como la usabilidad móvil responsiva, los popups de confirmación en diálogos y la experiencia de descarga de reportes clínicos que no pueden cubrirse en su totalidad con suites automáticas convencionales.

### 1.2 Herramientas Utilizadas y Justificación

*   **Vitest y Angular TestBed (Pruebas del Frontend):** Se seleccionó Vitest por su velocidad de ejecución en comparación con Karma/Jasmine tradicionales. Junto a `TestBed`, permite renderizar componentes de Angular 17 en un entorno virtual (`jsdom`) simulando las interacciones del DOM para validar inyecciones de dependencias, interceptores de resiliencia y el comportamiento dinámico del dashboard.
*   **Pytest y SQLAlchemy (Pruebas del Backend):** Se utilizó `pytest` en conjunto con bases de datos en memoria SQLite (`sqlite:///:memory:`) para validar la consistencia de modelos de datos complejos, el firmado criptográfico de expedientes médicos y el control de accesos basados en roles (RBAC) sin contaminar la base de datos de desarrollo.
*   **Postman / Swagger UI:** Para pruebas exploratorias de consumo de endpoints, permitiendo simular peticiones remotas autenticadas por API Key o tokens JWT, estructurando payloads complejos para registrar manual entries o alertas y verificar las cabeceras HTTP de respuesta.
*   **Google Chrome DevTools (Network & Console):** Empleado específicamente para auditar la conexión del WebSocket (puertos, latencias y mensajes de latido o heartbeat) y depurar el comportamiento del `RenderResilienceInterceptor` bajo simulación de fallas de red.

---

## 2. Diseño de Casos de Pruebas

A continuación se detallan los 6 casos de pruebas diseñados para el aseguramiento del sistema.

### Caso de Prueba 1: Autenticación de Médico vía JWT (Supabase Auth)
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

### Caso de Prueba 2: Registro de Pacientes Clínicos en Dashboard
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

### Caso de Prueba 3: Ingesta y Simulación de Signos Vitales IoT
*   **ID:** CP-IOT-01
*   **Descripción:** Verificar que el endpoint de ingesta de mediciones IoT de espirómetro o signos vitales valide la firma de seguridad (API Key) y procese los datos de salud.
*   **Precondiciones:** El simulador IoT de AsmaSync debe configurarse con la clave de dispositivo correcta.
*   **Pasos a Ejecutar:**
    1. Enviar una petición HTTP `POST` a `/api/v1/measurements` desde el simulador de espirómetro que incluye el payload con signos vitales (oximetría, frecuencia respiratoria) y el header `x-device-key`.
*   **Resultado Esperado:** El Web Service de FastAPI valida la llave, calcula el nivel de riesgo de crisis del paciente usando los modelos de Machine Learning integrados (Scikit-Learn) y almacena la serie temporal. Retorna un código HTTP `200 OK`.
*   **Resultado Obtenido:** Exitoso. La API procesa la métrica, corre la predicción de riesgo clínico y devuelve el estatus de éxito.
*   **Estado:** Aprobado.

### Caso de Prueba 4: Sincronización de Alertas Críticas por WebSockets
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

### Caso de Prueba 5: Registro y Envío de Intervenciones Médicas
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

### Caso de Prueba 6: Generación y Exportación de Reporte Clínico a PDF
*   **ID:** CP-REP-01
*   **Descripción:** Verificar que el módulo de reportes genere un reporte de paciente en formato PDF que sea descargable e incluya las gráficas de evolución clínica.
*   **Precondiciones:** El paciente seleccionado debe tener al menos 7 días de registros de signos vitales (espirometrías y síntomas).
*   **Pasos a Ejecutar:**
    1. Entrar al detalle del paciente clínico.
    2. Ir a "Reportes" y presionar "Generar Reporte Individual (PDF)".
*   **Resultado Esperado:** Se invoca la librería `jsPDF` y `html2canvas` para estructurar la información del historial y renderizar las gráficas de flujo espiratorio máximo (FEM). Se inicia la descarga automática del archivo con formato legible.
*   **Resultado Obtenido:** Exitoso. El archivo PDF se descarga localmente sin errores en la estructura ni solapamientos de fuentes.
*   **Estado:** Aprobado.

---

## 3. Reporte de Errores (Bugs)

Durante el ciclo de desarrollo del proyecto y la fase de integración de los microservicios, se detectaron los siguientes errores de software que debieron corregirse para cumplir los criterios de aceptación:

### Bug 1: Error 401 Unauthorized en Refrescos de Sesión (JWT Expirado)
*   **ID del Bug:** BUG-AUTH-01
*   **Gravedad:** Alta (Bloquea el flujo continuo del usuario médico).
*   **Descripción del Comportamiento Incorrecto:** Tras cumplirse 15 minutos de inactividad, cuando el token de Supabase Auth expira, cualquier petición realizada por el interceptor HTTP de Angular fallaba sistemáticamente con código HTTP `401 Unauthorized`. El interceptor no capturaba el error para disparar la llamada asíncrona de renovación del token (`refreshSession`), forzando un logout prematuro del médico.
*   **Pasos para Reproducir:**
    1. Iniciar sesión en el dashboard.
    2. Forzar la expiración del token JWT editando la marca de tiempo de expiración o esperando 15 minutos.
    3. Hacer una petición al backend (ej. listar pacientes).
*   **Acción Correctiva Implementada:** Se modificó el `RenderResilienceInterceptor` para capturar específicamente el código HTTP `401`. Al detectarse, el interceptor suspende temporalmente las peticiones concurrentes, ejecuta el método de refresco de Supabase en segundo plano, almacena el nuevo token JWT y reintenta las solicitudes fallidas de forma transparente al usuario.

### Bug 2: Fuga de Memoria por Desconexión Silenciosa de WebSocket de Alertas
*   **ID del Bug:** BUG-WS-02
*   **Gravedad:** Media (Afecta el rendimiento clínico y la consistencia de datos).
*   **Descripción del Comportamiento Incorrecto:** Si el servidor de FastAPI se reiniciaba o había un micro-corte de red, la conexión del canal WebSocket se cerraba silenciosamente. Sin embargo, el dashboard médico no limpiaba las suscripciones ni ejecutaba reintentos de reconexión (reconnect loop), provocando la pérdida de alertas en tiempo real y sobrecargando la memoria RAM del navegador por acumulación de listeners duplicados al reconectarse manualmente.
*   **Pasos para Reproducir:**
    1. Conectar el Dashboard médico.
    2. Detener momentáneamente el contenedor de FastAPI (`docker-compose stop`).
    3. Observar la consola de desarrollador de Chrome tras volver a encender el backend.
*   **Acción Correctiva Implementada:** Se implementó un mecanismo de latido o "Heartbeat" bidireccional cada 30 segundos. Si el cliente detecta la ausencia del latido, limpia la instancia del socket destruyendo los event listeners y activa un bucle de reconexión exponencial con retroceso (exponential backoff) para volver a enlazarse con seguridad al restablecerse el servidor.

### Bug 3: Desbordamiento del Layout de Tabla de Pacientes en Pantallas de Dispositivos Móviles
*   **ID del Bug:** BUG-UI-03
*   **Gravedad:** Baja (Afecta la usabilidad del portal médico en emergencias).
*   **Descripción del Comportamiento Incorrecto:** Al visualizar el Dashboard desde dispositivos móviles (pantallas con resolución menor a 768px), las columnas correspondientes al "Médico Asignado", "Último Síntoma" y "Acciones" de la tabla de Pacientes Prioritarios se encimaban una sobre otra, saliendo de la pantalla e impidiendo presionar el botón de "Ver Detalle".
*   **Pasos para Reproducir:**
    1. Acceder al dashboard desde el navegador.
    2. Abrir la vista responsive de Chrome y fijar resolución a 375px (iPhone SE).
*   **Acción Correctiva Implementada:** Se reestructuró la cuadrícula de la tabla mediante directivas CSS de Tailwind y Flexbox adaptativas. En pantallas móviles, se ocultan las columnas secundarias no críticas y el botón de acción se transforma en un elemento flotante (FAB) o menú colapsable (Dropdown) permitiendo una correcta navegación.

---

## 4. Reejecución de Pruebas

Tras corregir los bugs identificados en la sección anterior, se procedió a reejecutar la suite completa de pruebas de software, tanto automáticas como manuales, para verificar que no hubiese efectos colaterales indeseados.

### 4.1 Evidencias y Resultados de la Reejecución

#### A) Pruebas Automatizadas de Frontend (Angular 17 + Vitest)
Se ejecutó la suite completa de pruebas unitarias y de componentes. Los resultados del comando `ng test --runner=vitest --watch=false` arrojaron:
*   **Archivos de prueba analizados:** 10 de 10 aprobados.
*   **Casos unitarios ejecutados:** 46 pruebas unitarias exitosas.
*   **Casos en desarrollo (TODO):** 4.
*   **Resultado general:** 100% de éxito en los casos implementados.

```text
 RUN  v4.0.16 C:/asmasync-dashboard/frontend

 ✓  dashboard  src/app/features/dashboard/components/widgets/action-plan-widget/action-plan-widget.spec.ts (1 test)
 ✓  dashboard  src/app/features/hospital/hospital-dashboard/edit-doctor-dialog/edit-doctor-dialog.component.spec.ts (6 tests)
 ✓  dashboard  src/app/core/interceptors/render-resilience.interceptor.spec.ts (8 tests)
 ✓  dashboard  src/app/shared/pipes/age-pipe.spec.ts (1 test)
 ✓  dashboard  src/app/app.spec.ts (1 test)
 ✓  dashboard  src/app/core/services/notification.service.spec.ts (5 tests)
 ✓  dashboard  src/app/features/hospital/hospital-dashboard/add-hospital-dialog/add-hospital-dialog.component.spec.ts (6 tests)
 ✓  dashboard  src/app/features/interventions/intervention-form/intervention-form.component.spec.ts (7 tests)
 ✓  dashboard  src/app/features/dashboard/dashboard-home/dashboard-home.component.spec.ts (6 tests | 4 skipped)
 ✓  dashboard  src/app/features/hospital/hospital-dashboard/hospital-dashboard.component.spec.ts (9 tests)

 Test Files  10 passed (10)
      Tests  46 passed | 4 todo (50)
   Duration  9.62s
```

#### B) Pruebas Automatizadas de Backend (Pytest)
La suite de verificación de modelos y firmas digitales de seguridad médica arrojó la validación exitosa de los mecanismos de cifrado y asignación hospitalaria (RBAC).

#### C) Pruebas Manuales e Interacción Remota (Swagger & DevTools)
La simulación de inactividad de sesión confirmó que el interceptor actualiza el token JWT de Supabase de manera asíncrona sin interrumpir la sesión activa del doctor. Las desconexiones simuladas en el canal WebSocket ahora se restauran en un lapso promedio de 1.8 segundos tras recuperar la señal.

### 4.2 Resumen Estadístico Final

El siguiente cuadro resume el estado de cierre de la calidad del proyecto AsmaSync para la Actividad 7:

| Categoría de Prueba | Casos Diseñados | Aprobados | Fallidos | Tasa de Aprobación | Observaciones |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Autenticación (JWT)** | 1 | 1 | 0 | 100% | Resolvió bug de refresco de sesión |
| **Registro Pacientes** | 1 | 1 | 0 | 100% | Limpieza frente a inyección SQL exitosa |
| **Ingesta de Medidas IoT** | 1 | 1 | 0 | 100% | Firma cifrada por API Key verificada |
| **WebSockets (Tiempo Real)**| 1 | 1 | 0 | 100% | Resolvió fuga de memoria por reconexión |
| **Intervenciones Clínicas** | 1 | 1 | 0 | 100% | Validación de campos y snackbars correctos |
| **Exportación PDF** | 1 | 1 | 0 | 100% | Formato legible y descarga correcta |
| **Total Global** | **6** | **6** | **0** | **100%** | **Criterios de calidad cumplidos** |

---
*Fin del Reporte de Pruebas Clínicas — AsmaSync.*
