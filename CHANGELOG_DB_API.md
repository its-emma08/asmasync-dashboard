# CHANGELOG_DB_API.md: Sincronización de Seguridad (Fases 42-46)

**Dirigido a:** Juan Pablo (Backend API Developer)  
**Estado:** Implementación de Seguridad Avanzada Completada  

---

## Resumen Ejecutivo
Se han realizado actualizaciones críticas en la estructura de la base de datos y en los flujos de autenticación de la API para mitigar ataques de fuerza bruta, secuestro de sesiones (Session Hijacking), y manipulación de parámetros (IDOR). El sistema ahora soporta Bloqueo de Cuentas, Auditoría Persistente y Autenticación de Dos Factores (2FA) vía Email Interactivo.

---

## 1. Modificaciones a Tablas Existentes

### Tabla: `users`
| Columna | Tipo SQL | Tipo Python | Default | Justificación de Seguridad |
| :--- | :--- | :--- | :--- | :--- |
| `is_superuser` | BOOLEAN | bool | `False` | Segregación de privilegios para evitar IDOR en rutas administrativas. |
| `failed_login_attempts` | INTEGER | int | `0` | Contador para mitigación de ataques de Fuerza Bruta. |
| `locked_until` | DATETIME | datetime | `NULL` | Implementación de **Account Lockout** (bloqueo temporal tras 3 fallos). |
| `last_login` | DATETIME | datetime | `NULL` | Registro de actividad para detección de anomalías en el acceso. |
| `totp_secret` | VARCHAR | str | `NULL` | Almacenamiento de secretos de autenticación (mantenido por compatibilidad). |
| `is_2fa_enabled` | BOOLEAN | bool | `False` | Flag de control para bifurcar el flujo de login hacia validación 2FA. |

---

## 2. Nuevas Tablas Creadas

### Tabla: `audit_logs`
*Propósito: Trazabilidad total de operaciones CRUD y eventos de sistema (Compliance).*

- **Estructura:**
  - `id` (PK): Identificador único.
  - `user_id` (FK -> `users.id`): Usuario que realizó la acción (nullable para acciones anónimas).
  - `action`: Acción realizada (`CREATE`, `UPDATE`, `LOGIN`, `DELETE`, etc.).
  - `entity`: Entidad afectada (ej: `patient`, `auth`, `alert`).
  - `entity_id`: ID de la entidad afectada.
  - `changes` (JSON): Snapshot de los cambios (`{ "before": ..., "after": ... }`).
  - `ip_address`: IPv4/v6 del cliente para rastreo forense.
  - `user_agent`: Identificador del navegador/dispositivo.
  - `created_at`: Timestamp UTC de la operación.

### Tabla: `password_reset_codes`
*Propósito: Manejo seguro de recuperación de cuentas mediante OTP (One-Time Password).*

- **Estructura:**
  - `id` (PK).
  - `email`: Correo asociado al código.
  - `code`: Código alfanumérico de 6 dígitos.
  - `expires_at`: Límite de validez (15 minutos).
  - `created_at`: Registro de creación.

---

## 3. Impacto Crítico en la API (Pydantic & Endpoints)

> [!IMPORTANT]  
> **Cambio de Breaking Logic en Auth:** Los endpoints de login ya no garantizan un JWT inmediato.

### Flujo de Login con 2FA
Si un usuario tiene `is_2fa_enabled == True`, el endpoint `/login` responderá con `HTTP 200` pero el cuerpo será:
```json
{
  "require_2fa": true,
  "temp_token": "JWT_TEMPORAL_FIRMAD0",
  "options": ["12", "45", "89"],
  "access_token": null
}
```
**Acción Requerida:** No se debe tratar como un login exitoso. El frontend debe redirigir a `/login/2fa` enviando el `temp_token` y el código de 2 dígitos seleccionado por el usuario.

### Nuevos Endpoints de Seguridad
1. `POST /login/2fa`: Valida el código de email y entrega el `access_token` final.
2. `POST /2fa/setup`: Inicia el flujo de enrolamiento (genera código de prueba).
3. `POST /2fa/verify`: Activa el flag `is_2fa_enabled` permanentemente tras éxito inicial.
4. `POST /forgot-password`: Genera y registra el OTP en `password_reset_codes`.
5. `POST /verify-reset-code`: Valida el OTP y retorna un `temp_token` para cambio de password.
6. `POST /reset-password`: Actualiza el `password_hash` consumiendo el `temp_token`.

### Esquemas Actualizados
- `TokenResponse`: Ahora incluye campos opcionales `require_2fa` (bool) y `temp_token` (str).
- `UserInDB`: Ahora expone `last_login`, `is_2fa_enabled` y `doctor_code`.

---

**Nota Final:** Las migraciones de SQLAlchemy deben ejecutarse para reflejar estos cambios en producción. Se ha mantenido la compatibilidad hacia atrás en los modelos de perfil médico.
