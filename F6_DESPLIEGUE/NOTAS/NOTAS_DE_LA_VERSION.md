# 📝 NOTAS DE LA VERSIÓN (RELEASE NOTES) — ASMASYNC v2.1.4

**Sistema Inteligente de Monitoreo Clínico y Predicción del Asma**  
**Universidad Tecnológica del Centro de Veracruz (UTCV)**  
**Fecha de Liberación:** Octubre 2026  
**Versión:** 2.1.4 (SemVer 2.0.0)

---

## 📌 1. RESUMEN EJECUTIVO DE LA VERSIÓN

La versión **v2.1.4** de **AsmaSync** representa un hito fundamental en la evolución del ecosistema de monitoreo clínico. Esta entrega consolida las capacidades de autenticación reforzada de dos factores (2FA), trazabilidad forense mediante tablas de auditoría inmutables, integración de transmisión en tiempo real de biosensores IoT a través de WebSockets y optimizaciones de rendimiento en el Dashboard Angular 17.

---

## ✨ 2. NUEVAS FUNCIONALIDADES Y MEJORAS

### 🔒 A. Seguridad y Autenticación Avanzada
- **Autenticación Multi-Factor (2FA) por Email Interactivo:** Implementación de verificación OTP de 2 dígitos posterior al login de credenciales.
- **Bloqueo Temporal de Cuenta (Account Lockout):** Mitigación automática de ataques de fuerza bruta mediante el bloqueo por 15 minutos tras 3 intentos fallidos consecutivos.
- **Auditoría Persistente (Tabla `audit_logs`):** Captura detallada de eventos de sistema, inicios de sesión y modificaciones de expedientes médicos con dirección IP y User-Agent.
- **Recuperación de Contraseña Segura:** Flujo de autoservicio de restablecimiento vía OTP enviado al correo del usuario.

### 📊 B. Dashboard Web (Angular 17)
- **Monitoreo en Tiempo Real por WebSockets:** Actualización continua de gráficos de SpO2 y PEF sin recargar la página.
- **Visualización de Alertas por Niveles de Riesgo:** Código de colores dinámico (Verde/Amarillo/Rojo) según las predicciones del modelo de Machine Learning.
- **Exportación de Reportes Clínicos en PDF:** Generación instantánea de reportes de evolución clínica del paciente.

### ⚡ C. Backend y Microservicios (FastAPI & IA)
- **Integración con Redis Cache:** Reducción del tiempo de respuesta de la API a menos de 50ms para consultas de telemetría.
- **Modelo de IA Mejorado:** Re-entrenamiento del clasificador Random Forest alcanzando un 92.4% de precisión en la predicción de crisis asmáticas.

---

## 🐛 3. CORRECCIÓN DE ERRORES (BUG FIXES)

- **FIX-102:** Resuelto el problema de desincronización de tokens JWT durante el refresco de sesión en Angular.
- **FIX-105:** Corrección en el parsing de zonas horarias UTC a hora local de México en los reportes exportados.
- **FIX-108:** Eliminada fuga de memoria producida por conexiones WebSocket no cerradas adecuadamente al cambiar de pantalla.

---

## 🔄 4. INSTRUCCIONES DE MIGRACIÓN Y BASE DE DATOS

Para actualizar una versión anterior (v2.0.x) a la versión v2.1.4, se deben ejecutar las siguientes migraciones de SQL:
```bash
# Aplicar migraciones con Alembic
alembic upgrade head
```
O ejecutar el script `schema.sql` en la base de datos PostgreSQL objetivo.

---

## 📋 5. REQUISITOS MÍNIMOS DE DESPLIEGUE

- **Backend:** Python 3.11+, FastAPI 0.100+, PostgreSQL 15+, Redis 7+
- **Frontend:** Node.js 18+ LTS, Angular 17+
- **Contenedores:** Docker 24.0+, Docker Compose v2.18+
