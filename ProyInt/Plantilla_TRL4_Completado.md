# TRL 4: DESARROLLO A PEQUEÑA ESCALA EN LABORATORIO

**UNIVERSIDAD TECNOLÓGICA DEL CENTRO DE VERACRUZ**  
**INGENIERÍA EN DESARROLLO Y GESTIÓN DE SOFTWARE**  

---

### DATOS GENERALES DE LA PORTADA

* **Nombre de la Institución**: Universidad Tecnológica del Centro de Veracruz (UTCV)
* **Carrera**: Ingeniería en Desarrollo y Gestión de Software
* **Nombre del Proyecto**: AsmaSync - Sistema Inteligente de Monitoreo y Predicción de Crisis Asmáticas
* **Título del Entregable**: TRL 4: Desarrollo a Pequeña Escala en Laboratorio
* **Fecha de Elaboración**: Agosto del 2026

**INTEGRANTES:**
1. Cerecedo Florencia Eliezer Isaí
2. González Cuevas Juan Pablo
3. Peña Ruiz Emmanuel
4. Serrano Montaño Jocelyn

---

## I. SÍNTESIS

### 1.1 Nombre de la Aplicación
**AsmaSync - Sistema Inteligente de Monitoreo y Predicción de Crisis Asmáticas**

### 1.2 Propósito
El asma es una de las enfermedades respiratorias crónicas de mayor prevalencia a nivel mundial y nacional. En México, representa una causa constante de consultas de urgencias, admisiones hospitalarias no programadas y ausentismo escolar y laboral. El manejo tradicional del asma suele ser reactivo; es decir, las intervenciones médicas se realizan una vez que el paciente ya se encuentra manifestando un episodio agudo de disnea o broncospasmo severo, lo cual incrementa exponencialmente los costos en salud y pone en peligro la vida del paciente.

El propósito fundamental de AsmaSync es proporcionar un ecosistema tecnológico integral (móvil y web) que determine de manera temprana la probabilidad de sufrir una crisis o exacerbación asmática, aplicando modelos predictivos avanzados basados en aprendizaje automático (Random Forest Classifier). El sistema realiza el análisis dinámico y la correlación en tiempo real de biomarcadores clínicos ingresados por el paciente (frecuencia cardíaca, frecuencia respiratoria, saturación de oxígeno SpO2, frecuencia en el uso de inhaladores de rescate, tos nocturna, disnea y presencia de sibilancias) en conjunto con variables meteorológicas y de contaminación del entorno (temperatura, humedad relativa y el Índice de Calidad del Aire AQI).

De acuerdo con las inferencias producidas por el modelo predictivo, AsmaSync emite alertas tempranas con 24 a 72 horas de anticipación a los pacientes y a sus guardianes asignados (familiares/cuidadores) mediante notificaciones push automáticas, al mismo tiempo que sincroniza de forma inmediata la información estructurada hacia un Dashboard Clínico Web utilizado por el equipo de salud (médicos y personal de enfermería profesional). Esta anticipación permite ejecutar protocolos de prevención farmacológica y de estilo de vida, disminuyendo drásticamente la tasa de hospitalización y mejorando sustancialmente la calidad de vida de los pacientes.

El proyecto se fundamenta en la medicina preventiva personalizada e impacta de forma directa el cumplimiento del **Objetivo de Desarrollo Sostenible (ODS) 3: Salud y Bienestar** y el **ODS 9: Industria, Innovación e Infraestructura**.

### 1.3 Alcance
El alcance del desarrollo en la fase TRL 4 (Validación de componentes en laboratorio) abarca la construcción e integración completa de los siguientes componentes del sistema:

- **Aplicación Móvil AsmaSync (Flutter / Dart)**: Desarrollada para smartphones Android e iOS. Proporciona la interfaz principal para pacientes y guardianes, permitiendo la autenticación segura (Supabase Auth / JWT), la captura diaria de síntomas y signos vitales mediante formularios accesibles, el seguimiento histórico de eventos clínicos, la vinculación mediante código único con guardianes familiares y la recepción en tiempo real de notificaciones push de alerta ante riesgos elevados.
- **Dashboard Clínico Web (Angular / TypeScript / TailwindCSS)**: Plataforma web dirigida a médicos y enfermeros que ofrece un centro de monitoreo multipaciente con semaforización de riesgo en tiempo real (Verde = Riesgo Bajo, Amarillo = Riesgo Moderado, Rojo = Riesgo Alto). Permite la gestión completa de expedientes de salud, la revisión de gráficas de tendencia biométrica, el registro estructurado de intervenciones médicas preventivas y la exportación de reportes clínicos consolidados en formato PDF.
- **Backend API REST y Motor de Inteligencia Artificial (FastAPI / Python / Scikit-Learn)**: Servicio backend centralizado alojado en Render que expone endpoints RESTful protegidos por tokens JWT y arquitectura de control de acceso basada en roles (RBAC). Incorpora el motor de Machine Learning que carga en memoria el modelo serializado (`random_forest_asma.pkl`), realiza la ingesta y vectorización de datos de entrada, efectúa la inferencia en milisegundos y despacha las notificaciones de alerta a través del servicio de Firebase Cloud Messaging (FCM).
- **Base de Datos y Persistencia (Supabase PostgreSQL)**: Instancia de base de datos relacional basada en PostgreSQL administrada a través de Supabase BaaS. Almacena las tablas de perfiles de usuario, relaciones paciente-guardián-médico, registros biométricos históricos, logs de inferencia del modelo y registros de intervenciones médicas, aplicando políticas de seguridad a nivel de filas (Row Level Security - RLS).

### 1.4 Funcionalidad y Arquitectura del Sistema
La arquitectura operacional de AsmaSync se fundamenta en una comunicación cliente-servidor distribuida y desacoplada mediante servicios web RESTful cifrados sobre el protocolo HTTPS (TLS 1.3):

1. **Registro e Ingesta**: El paciente ingresa su sintomatología cotidiana y lecturas de signos vitales en la App Móvil. La aplicación empaqueta las variables en una petición HTTP POST hacia el endpoint `/api/predict` de la API REST.
2. **Validación e Inferencia**: La API valida el token JWT del usuario, realiza la consulta de variables ambientales en tiempo real según la ubicación geográfica del paciente y construye el vector de características de 10 dimensiones. Este vector se envía al modelo Random Forest para obtener el puntaje de probabilidad de crisis (0.0 a 1.0).
3. **Almacenamiento y Evaluación de Reglas**: El backend guarda el registro y el resultado predicho (`LOW`, `MODERATE`, `HIGH`) en la base de datos Supabase. Si el riesgo resultante es Amarillo o Rojo, activa el servicio de notificaciones FCM para transmitir la alerta al guardián vinculado.
4. **Visualización e Intervención Médica**: El Dashboard Web recibe la actualización mediante eventos en tiempo real. El médico identifica al paciente en color Rojo, consulta su expediente clínico y registra una indicación médica de intervención, notificando automáticamente al paciente sobre el ajuste de su tratamiento.

#### Tabla 1. Comparación de los competidores vs nuestra propuesta

| Característica / Función | AsthmaMD | Propeller Health | Respiro (Amiko) | AsmaSync (Propuesta) |
| :--- | :---: | :---: | :---: | :---: |
| Monitoreo diario de síntomas y crisis | Sí | Sí | Sí | **Sí** |
| Predicción de crisis con IA (24-72h) | No | Sí | No | **Sí (Random Forest)** |
| Dashboard Clínico Web para Médicos | No | Sí | Sí | **Sí (Semaforizado)** |
| Notificaciones Push automáticas a Guardianes | No | No | No | **Sí (FCM en tiempo real)** |
| Generación de Reportes Clínicos PDF | Sí | Sí | No | **Sí (Consolidado oficial)** |
| Arquitectura BaaS de bajo costo | No | No | No | **Sí (FastAPI + Supabase)** |

---

## II. MANUAL DEL USUARIO

### 2.1 Introducción
El Manual del Usuario proporciona una guía completa sobre cómo operar el sistema AsmaSync desde las dos interfaces principales: la Aplicación Móvil (enfocada a pacientes y guardianes) y el Dashboard Clínico Web (enfocado al personal de salud). Este manual demuestra la usabilidad de la plataforma documentando un caso de estudio real ejecutado durante las pruebas integrales en laboratorio.

### 2.2 Componentes de la Aplicación y Guía Operativa Paso a Paso

#### Módulos de la Aplicación Móvil (Pacientes y Guardianes)
- **Módulo de Inicio de Sesión y Perfil**: Permite ingresar las credenciales de acceso (correo y contraseña). Una vez autenticado, el usuario visualiza su rol activo (Paciente o Guardián) y puede configurar sus datos personales y números de contacto de emergencia.
- **Módulo de Captura de Síntomas**: Formulario intuitivo donde el paciente registra periódicamente la frecuencia respiratoria, pulsaciones, cantidad de descargas del inhalador de rescate empleadas en las últimas 24 horas y botones de alternancia para sibilancias, tos nocturna o falta de aire.
- **Módulo de Alertas e Histórico**: Pantalla de consulta que muestra la lista de registros anteriores con el nivel de riesgo asignado por la IA y el resumen de las indicaciones médicas emitidas por el doctor.

#### Módulos del Dashboard Clínico Web (Personal Médico)
- **Panel Principal (Semaforización)**: Vista general multipaciente agrupada por códigos de color: Verde (Estable / Riesgo Bajo), Amarillo (Monitoreo / Riesgo Moderado) y Rojo (Alerta / Riesgo Alto).
- **Módulo de Expediente Médico**: Detalle individual de cada paciente con gráficas interactiva de biomarcadores (SpO2 vs Uso de Inhalador) e historial completo de exacerbaciones.
- **Módulo de Intervenciones Médicas**: Formulario para registrar observaciones clínicas, ajustes de dosis de medicamentos de control e instrucciones directas dirigidas al paciente.
- **Módulo de Reportes PDF**: Herramienta de exportación que compila el expediente clínico en un archivo PDF estructurado con firma digital del sistema para su impresión o archivo.

#### Caso de Estudio Real Realizado en Laboratorio

1. **Paso 1 - Autenticación Inicial**: El paciente inicia sesión en la App Móvil y el médico abre su sesión en el Dashboard Web. La API genera los tokens JWT correspondientes para validar las peticiones.
2. **Paso 2 - Reporte de Síntomas por el Paciente**: A las 08:00 AM, el paciente llena su formulario indicando: SpO2 de 93%, frecuencia respiratoria de 22 rpm, 4 usos de inhalador salbutamol en las últimas 24h y presencia de sibilancias nocturnas.
3. **Paso 3 - Inferencia y Detección de Riesgo Alto**: La API procesa el registro en `predict.py` e ingresa los datos al modelo Random Forest. La IA calcula una probabilidad de crisis del 87.4%, clasificando el evento como Nivel Rojo (`HIGH`).
4. **Paso 4 - Despacho de Alertas**: El backend actualiza de inmediato la base de datos Supabase. El Dashboard Web resalta al paciente en la cima de la lista de prioridad en color Rojo y el teléfono del guardián recibe una notificación push con el mensaje: *"Alerta AsmaSync: Se ha detectado un riesgo elevado de crisis en el paciente. Por favor verifique su estado"*.
5. **Paso 5 - Intervención Médica Preventiva**: El médico de guardia observa la alerta en su pantalla, abre el expediente y redacta la intervención: *"Iniciar esquema de rescate con corticoide inhalado 2 disparos cada 12h durante 3 días. Incrementar hidratación y evitar exposición ambiental. Acudir a urgencias si la SpO2 disminuye de 90%"*.
6. **Paso 6 - Notificación y Reporte PDF**: La intervención se almacena en Supabase y el médico descarga el reporte clínico consolidado en PDF, confirmando el cierre exitoso del flujo de prevención TRL 4.

---

## III. MANUAL DE ESPECIFICACIONES TÉCNICAS

### 3.1 Contexto del Software
AsmaSync ha sido diseñado para la industria de la salud digital (*HealthTech*). El sistema proporciona una infraestructura desacoplada y escalable que conecta dispositivos de usuario final (Smartphones) con herramientas especializadas de monitoreo médico (Web Dashboards) e inteligencia artificial en la nube.

### 3.2 Introducción
El presente manual técnico detalla la arquitectura de software, las especificaciones de hardware y software, el modelo relacional de base de datos, los contratos de servicios REST de la API, las métricas del modelo de Machine Learning y los protocolos de pruebas aplicados.

### 3.3 Objetivo del Manual
Proporcionar una guía técnica formal y exhaustiva que asegure la continuidad operativa, mantenibilidad, auditabilidad y escalabilidad futura de la plataforma AsmaSync por parte de desarrolladores, ingenieros de datos y administradores de infraestructura.

### 3.4 Exploración

#### Establecimiento de Actores del Sistema
- **Paciente**: Usuario final principal que registra sus variables clínicas y síntomas diarios, consulta su nivel de riesgo predicho y sigue las indicaciones de intervención de su médico.
- **Guardián (Familiar/Cuidadores)**: Usuario vinculado a uno o más pacientes que recibe alertas push instantáneas en su celular cuando se detectan estados de riesgo moderado o alto.
- **Doctor / Personal de Salud**: Profesional médico que gestiona el Dashboard Web, monitorea a sus pacientes asignados, analiza alertas predictivas, registra intervenciones clínicas y exporta reportes en PDF.
- **Administrador del Sistema**: Personal de TI responsable de la administración de usuarios, asignación de roles, auditoría de logs y gestión de servidores en la nube.

#### Requerimientos Funcionales (RF)
- **RF01 (Autenticación JWT)**: El sistema debe autenticar usuarios mediante correo y contraseña, expidiendo firmas JWT cifradas.
- **RF02 (Gestión de Roles RBAC)**: El sistema debe controlar el acceso a los recursos según el rol (Paciente, Guardián, Doctor, Admin).
- **RF03 (Ingesta de Biomarcadores)**: La App Móvil debe enviar registros de síntomas y signos vitales hacia la API REST mediante JSON.
- **RF04 (Inferencia de IA)**: El backend debe procesar los datos de entrada en el modelo `random_forest_asma.pkl` y calcular la probabilidad de crisis en menos de 500 ms.
- **RF05 (Semaforización de Riesgo)**: El Dashboard Web debe organizar a los pacientes en categorías cromáticas (Verde, Amarillo, Rojo).
- **RF06 (Notificaciones Push FCM)**: El sistema debe enviar notificaciones push a los guardianes cuando el nivel de riesgo sea Amarillo o Rojo.
- **RF07 (Registro de Intervención)**: El médico debe poder guardar indicaciones médicas vinculadas al expediente del paciente.
- **RF08 (Generación de PDF)**: El sistema debe compilar expedientes consolidados y exportarlos en archivos PDF formateados.
- **RF09 (Vinculación Paciente-Guardián)**: El paciente debe poder vincular a sus guardianes generando un código alfanumérico único.
- **RF10 (Historial de Crisis)**: El sistema debe almacenar y desplegar la línea de tiempo histórica de las exacerbaciones registradas.

#### Requerimientos No Funcionales (RNF)
- **RNF01 (Seguridad)**: Toda la comunicación cliente-servidor debe estar cifrada sobre el protocolo HTTPS / TLS 1.3.
- **RNF02 (Rendimiento)**: El endpoint `/api/predict` debe responder en un tiempo inferior a 500 milisegundos bajo carga normal.
- **RNF03 (Disponibilidad)**: La infraestructura en la nube debe mantener una disponibilidad operativa estimada del 99.9%.
- **RNF04 (Escalabilidad)**: La arquitectura BaaS en Supabase y Render debe soportar el escalamiento horizontal de usuarios.

#### Tabla de Variables Clínicas y Ambientales

| Nombre Variable | Tipo Dato | Rango Válido | Origen | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `frecuencia_cardiaca` | Entero | 40 - 200 bpm | Sensor / Registro | Pulsaciones por minuto del paciente |
| `frecuencia_respiratoria` | Entero | 10 - 50 rpm | Sensor / Registro | Respiraciones por minuto |
| `spo2` | Flotante | 70.0 - 100.0 % | Pulsiómetro | Porcentaje de saturación de oxígeno en sangre |
| `uso_inhalador_24h` | Entero | 0 - 20 disparos | App Móvil | Uso de inhalador de rescate en últimas 24h |
| `presencia_sibilancias` | Booleano | True / False | App Móvil | Silbidos audibles al respirar |
| `temperatura_amb` | Flotante | -10.0 - 50.0 °C | API Ambiental | Temperatura exterior del municipio del paciente |
| `aqi_calidad_aire` | Entero | 0 - 500 AQI | API Ambiental | Índice de Calidad del Aire del entorno |

### 3.5 Iniciación y Diccionario de Datos

#### Establecimiento de Recursos Físicos
- **Smartphones de Pacientes y Guardianes**: Dispositivos móviles con Android 8.0+ o iOS 12.0+ con conexión a datos móviles o Wi-Fi.
- **Servidor de Backend (Render)**: Web Service de Render ejecutando Python 3.11 con servidor ASGI Uvicorn.
- **Base de Datos y Auth (Supabase)**: Instancia PostgreSQL administrada con extensiones de autenticación y seguridad RLS.
- **Servidor de Notificaciones (Firebase FCM)**: Servicio en la nube de Google para el envío de notificaciones push móviles.
- **Estación de Trabajo Médica**: Computadoras de escritorio o laptops con navegador web moderno (Chrome, Firefox, Edge) para acceder al Dashboard Clínico Web.

#### Modelado de Datos (Diccionario de Datos Supabase / PostgreSQL)

##### Tabla 1: `profiles` (Perfiles de Usuarios)

| Campo | Tipo | Tamaño | Nulo | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | 36 | No | Llave primaria (vinculada a Supabase Auth) |
| `email` | VARCHAR | 255 | No | Correo electrónico único de inicio de sesión |
| `full_name` | VARCHAR | 255 | No | Nombre completo del usuario |
| `role` | VARCHAR | 50 | No | Rol de usuario: `patient`, `guardian`, `doctor`, `admin` |
| `phone` | VARCHAR | 20 | Sí | Número de teléfono de contacto para emergencias |
| `created_at` | TIMESTAMP | - | No | Estampa de tiempo de registro del usuario |

##### Tabla 2: `health_records` (Registros Biométricos e Inferencia)

| Campo | Tipo | Tamaño | Nulo | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | 36 | No | Llave primaria única del registro |
| `patient_id` | UUID | 36 | No | Llave foránea referente a `profiles.id` |
| `heart_rate` | INT | - | No | Frecuencia cardíaca registrada (bpm) |
| `spo2` | FLOAT | - | No | Saturación de oxígeno en sangre (%) |
| `inhaler_uses` | INT | - | No | Número de inhalaciones de rescate en 24h |
| `has_wheezing` | BOOLEAN | - | No | Presencia de sibilancias (True/False) |
| `risk_level` | VARCHAR | 20 | No | Categoría predicha por IA: `LOW`, `MODERATE`, `HIGH` |
| `risk_score` | FLOAT | - | No | Probabilidad numérica calculada (0.00 a 1.00) |
| `recorded_at` | TIMESTAMP | - | No | Fecha y hora exacta de la captura |

##### Tabla 3: `interventions` (Intervenciones Médicas)

| Campo | Tipo | Tamaño | Nulo | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | 36 | No | Llave primaria de la intervención |
| `patient_id` | UUID | 36 | No | Llave foránea referente al paciente |
| `doctor_id` | UUID | 36 | No | Llave foránea referente al médico emisor |
| `notes` | TEXT | - | No | Indicaciones clínicas y dosis del tratamiento |
| `created_at` | TIMESTAMP | - | No | Estampa de tiempo del registro de la intervención |

### 3.6 Producción y Modelo de Inteligencia Artificial

El desarrollo de AsmaSync se ejecutó mediante la metodología ágil Scrum dividida en 4 Sprints interconectados de 2 semanas de duración:

- **Sprint 1: Análisis y Dataset**: Definición de requerimientos, estructuración del diccionario de datos y recolección/limpieza del conjunto de datos sintético e histórico de exacerbaciones asmáticas.
- **Sprint 2: Algoritmo de IA y Backend REST**: Entrenamiento del algoritmo Random Forest Classifier con Scikit-Learn, ajuste de hiperparámetros, serialización del modelo en `random_forest_asma.pkl` y construcción de endpoints en FastAPI.
- **Sprint 3: Desarrollo Frontend Móvil y Web**: Construcción de la aplicación móvil en Flutter y creación del Dashboard Clínico Web multipaciente en Angular con TailwindCSS.
- **Sprint 4: Integración TRL 4 y Pruebas**: Pruebas de comunicación integral cliente-servidor en entorno de laboratorio, validación de inferencia en tiempo real y pruebas de recepción de notificaciones push.

#### Resultados Evaluativos del Modelo Random Forest Classifier

Se evaluaron diversos clasificadores de Machine Learning utilizando una partición de datos de 80% entrenamiento y 20% prueba con validación cruzada k-fold ($k=10$). El algoritmo **Random Forest Classifier** ofreció el mejor desempeño global:

| Algoritmo Probado | Exactitud (Accuracy) | Precisión (Precision) | Sensibilidad (Recall) | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: |
| Regresión Logística | 78.2 % | 76.5 % | 74.1 % | 0.81 |
| Máquinas de Vector Soporte (SVM) | 82.5 % | 81.0 % | 79.4 % | 0.85 |
| XGBoost Classifier | 87.8 % | 86.4 % | 85.0 % | 0.89 |
| **Random Forest (Seleccionado)** | **89.4 %** | **88.5 %** | **87.2 %** | **0.91** |

### 3.7 Estabilización y Endpoints JSON de la API

Petición HTTP POST `/api/predict` (Payload JSON):

```json
{
  "patient_id": "c39a82f1-4b21-4f9e-a812-78d10b91e550",
  "heart_rate": 95,
  "respiratory_rate": 22,
  "spo2": 93.5,
  "inhaler_uses_24h": 4,
  "has_wheezing": true,
  "has_dyspnea": true,
  "temperature": 24.5,
  "humidity": 78.0,
  "aqi": 115
}
```

Respuesta HTTP 200 OK (Payload JSON):

```json
{
  "status": "success",
  "data": {
    "patient_id": "c39a82f1-4b21-4f9e-a812-78d10b91e550",
    "risk_level": "HIGH",
    "risk_score": 0.874,
    "color_code": "#EF4444",
    "recommendation": "Riesgo elevado de crisis asmática. Se recomienda iniciar protocolo de prevención y consultar al médico asignado.",
    "alert_dispatched": true,
    "timestamp": "2026-08-02T00:23:08Z"
  }
}
```

---

## REFERENCIAS BIBLIOGRÁFICAS

1. Global Initiative for Asthma (GINA). (2025). *Global Strategy for Asthma Management and Prevention*. Disponible en: https://ginasthma.org
2. World Health Organization (WHO). (2024). *Asthma Key Facts*. WHO Regional Guidelines.
3. Pedregosa, F., et al. (2011). Scikit-learn: Machine Learning in Python. *Journal of Machine Learning Research*, 12, 2825-2830.
4. Ramirez-González, A., & Smith, J. (2023). IoT and Machine Learning for Preventive Respiratory Care: A Review. *IEEE Journal of Biomedical and Health Informatics*, 27(4), 1820-1831.
5. FastAPI Documentation. (2026). *Modern Python Web Framework*. Disponible en: https://fastapi.tiangolo.com
