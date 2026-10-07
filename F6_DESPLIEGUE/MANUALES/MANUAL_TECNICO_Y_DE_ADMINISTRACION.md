# 🛠️ MANUAL TÉCNICO Y DE ADMINISTRACIÓN DEL SISTEMA — ASMASYNC

**Sistema Inteligente de Monitoreo Clínico y Predicción del Asma**  
**Universidad Tecnológica del Centro de Veracruz (UTCV)**

---

## 🏛️ 1. ARQUITECTURA GENERAL DEL SISTEMA

El ecosistema **AsmaSync** está diseñado bajo una arquitectura orientada a microservicios decoplados y comunicación por eventos, estructurada en tres capas principales:

1. **Capa de Presentación (Frontend Web & App Móvil):**
   - **Dashboard Web:** Desarrollado en **Angular 17** con TypeScript estricto, Angular Material y RxJS. Aloja paneles interactivos para médicos.
   - **App Móvil:** Desarrollada en **Flutter**, encargada de la captura en tiempo real de datos biométricos.
2. **Capa de Servicios y Lógica de Negocio (Backend API):**
   - **API REST & WebSockets:** Desarrollada en **FastAPI (Python 3.11)**. Maneja autenticación segura JWT, 2FA, ingesta de biosensores y alertas en tiempo real.
   - **Modelo de Inteligencia Artificial (ML):** Clasificador de riesgo de crisis asmática basado en **Scikit-Learn (RandomForest Classifier)** entrenado con lecturas de SpO2 y PEF.
3. **Capa de Persistencia y Caché:**
   - **Base de Datos Relacional:** **PostgreSQL 15** para el almacenamiento estructurado de usuarios, expedientes clínicos y logs de auditoría.
   - **Servidor de Caché y Colas:** **Redis 7** para gestión de sesiones volátiles y transmisión por sockets.

---

## 🔒 2. ESQUEMA DE SEGURIDAD Y NORMATIVAS

- **Autenticación en Dos Pasos (2FA):** Implementada mediante tokens OTP enviados por correo electrónico y validación temporal JWT.
- **Bloqueo de Cuentas (Account Lockout):** Suspensión de cuenta por 15 minutos tras 3 intentos fallidos de inicio de sesión consecutivos.
- **Log de Auditoría Persistente:** Registro inmutable de operaciones CRUD en la tabla `audit_logs` con IP y User-Agent.
- **Cumplimiento Regulatorio:** Diseñado en apego a la norma mexicana **NOM-004-SSA3-2012** (Expediente Clínico Electrónico) y estándares internacionales **HIPAA / GDPR** para la protección de PHI (Protected Health Information).

---

## 🗄️ 3. ESTRUCTURA DE LA BASE DE DATOS

### Tablas Principales:
- `users`: Usuarios del sistema (médicos, administradores, pacientes).
- `patients`: Expedientes clínicos de pacientes registrados.
- `telemetry_logs`: Lecturas de biosensores (SpO2, PEF, Frecuencia Cardíaca, Temperatura).
- `audit_logs`: Trazabilidad de seguridad de accesos y cambios.
- `password_reset_codes`: Códigos OTP para recuperación de contraseña y 2FA.

---

## ⚙️ 4. MANTENIMIENTO Y ADMINISTRACIÓN

- **Respaldos de Base de Datos (pg_dump):**
  ```bash
  pg_dump -U asmasync_user -d asmasync_db -F c -b -v -f /backups/asmasync_db_$(date +%Y%m%m).backup
  ```
- **Monitoreo de Logs de Aplicación:**
  ```bash
  docker logs -f asmasync_backend
  ```
