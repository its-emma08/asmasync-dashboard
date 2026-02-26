# Security_Audit_Report.md
## AsmaSync — Auditoría Autónoma de Seguridad & Calidad

**Auditor:** CISO Autónomo / Lead QA  
**Fecha:** 2026-02-24  
**Stack:** Angular 17 · FastAPI · SQLAlchemy · PostgreSQL · Bcrypt · JWT (HS256)  
**Metodología:** STRIDE Cross-Reference + Código Fuente Directo

---

## 🔍 Resumen Ejecutivo

El proyecto AsmaSync ha implementado múltiples capas de seguridad de forma progresiva a lo largo de las fases anteriores. La postura global de seguridad es **Buena para una etapa MVP**, con áreas específicas que requieren atención antes de producción. Se identificaron **4 hallazgos de criticidad media**, **1 hallazgo crítico** y un backlog sustancial de mejoras UX/UI.

---

## Análisis por Amenaza (STRIDE)

### Amenaza 1: Man-in-the-Middle (MitM) — 🟡 Parcialmente Mitigada

**Evidencia en Código:**
- ✅ `main.py:34-37`: Headers de seguridad correctos (`Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`).
- ✅ `security.py:30-32`: Las contraseñas se hashean con `bcrypt` + salt aleatorio antes de almacenarse. NUNCA en texto plano.
- ✅ `auth.py:170-176`: Refresh Tokens se transmiten vía **HttpOnly Cookie** (`secure=True`, `samesite='lax'`).

**🟡 Punto Ciego Identificado:**
- `main.py:15-21` **[HALLAZGO MEDIO]**: Las CORS Origins están **hardcodeadas** directamente en el código fuente en lugar de leerse de variables de entorno (`settings.CORS_ORIGINS`). Esto viola el Principio de Separación de Configuración y puede comprometer el control de acceso multi-entorno.
  ```python
  # main.py — Línea 15-21 — ORIGEN HARDCODEADO
  origins = ["http://localhost:4200", "http://localhost:3000", ...]
  # CORRECCIÓN REQUERIDA: Reemplazar por settings.CORS_ORIGINS
  ```

---

### Amenaza 2: Acceso No Autorizado — 🟢 Totalmente Mitigada

**Evidencia en Código:**
- ✅ `auth.py:96-114`: Bloqueo real de cuentas tras **3 intentos fallidos**: `locked_until = now + timedelta(minutes=15)`. Retorna `HTTP 429`.
- ✅ `user.py (models):26-27`: Los campos `failed_login_attempts` y `locked_until` persisten en la base de datos.
- ✅ `auth.py:419-451`: Flujo OTP completo: generación (`random.randint`, 6 dígitos), almacenamiento en `password_reset_codes`, validación de expiración (15 min).
- ✅ `audit_log.py`: Tabla `audit_logs` activa. El servicio `AuditService` registra `LOGIN`, `LOGIN_2FA`, `REGISTER`, `PASSWORD_RESET`, `ENABLE_2FA`, `DISABLE_2FA`.
- ✅ `session-timer.service.ts:13`: Sesión inactiva se cierra automáticamente tras **5 minutos**.

---

### Amenaza 3: Manipulación de Datos IoT (PEF Spoofing) — 🟢 Totalmente Mitigada

**Evidencia en Código:**
- ✅ `measurement.py (schemas):22-27`: Validador Pydantic estricto sobre PEF:
  ```python
  @field_validator('pef')
  def validate_pef(cls, v):
      if v <= 0 or v > 900:
          raise ValueError('PEF debe ser un valor positivo válido (0-900)')
  ```
- ✅ `MeasurementBase`: Tipo `float` fuerza rechazo de strings arbitrarios.
- ✅ SQLAlchemy ORM protege el tipado en la capa de persistencia.

**🟡 Punto Ciego Menor:**
- El `MeasurementBase` base (sin validadores) acepta rangos arbitrarios de `value` floats. Si un tipo nuevo de medición usa ese schema directamente sin validador específico, valores absurdos podrían pasar. Recomendación: Agregar validadores de rango por `measurement_type`.

---

### Amenaza 4: Inyección SQL — 🟢 Totalmente Mitigada

**Evidencia en Código:**
- ✅ Búsqueda de `text(` (SQLAlchemy raw SQL) en `/backend/app/api/` → **0 resultados**. El proyecto utiliza SQLAlchemy ORM 100%.
- ✅ Pydantic valida y rechaza tipos incorrectos antes de que lleguen al ORM.
- ✅ Frontend: `no-sql-injection.validator.ts` bloquea patrones como `'OR`, `--`, `;`, `/*`, `xp_`.

**🟡 HALLAZGO MEDIO — Validador XSS Limitado:**
- `no-sql-injection.validator.ts:10`: El regex **no cubre ataques XSS básicos** (`<script>`, `onerror=`, `javascript:`). Un usuario podría inyectar HTML malicioso en campos de texto libre (nombre de paciente, notas).
  ```typescript
  // Línea 10 — FALTA cobertura XSS
  const sqlPattern = /(')|(--)|(;)|(\\/\\*)|(xp_)/i;
  // AGREGAR: /<script|onerror=|javascript:/i
  ```
- El backend no aplica sanitización HTML en ningún campo string de `PatientCreate` o `UserCreate`.

---

### Amenaza 5: Session Hijacking — 🔴 HALLAZGO CRÍTICO

**Evidencia en Código:**
- ✅ `config.py:17`: Access Token expira en **5 minutos**. Buena práctica.
- ✅ `auth.service.ts:210-223`: `logout()` llama a `this.storageService.clear()` que limpia `localStorage`. ✅
- ✅ `auth.py:376-392`: **Rotación de Refresh Token**: cada vez que se usa, se genera uno nuevo. Excelente práctica.

**🔴 HALLAZGO CRÍTICO — `temp_2fa_token` en localStorage Plano:**
- `auth.service.ts:203`: El `temp_2fa_token` temporal es removido vía `localStorage.removeItem()` directamente, saltando `StorageService` (que usa AES encryption).
  ```typescript
  // auth.service.ts:203 — PROBLEMA: bypass del StorageService
  localStorage.removeItem('temp_2fa_token');
  // En auth.service.ts:75, también se guarda con StorageService pero se limpia directamente
  ```
  Aunque el token es temporal (5 min), al estar accesible sin cifrar durante esa ventana, es vulnerable a XSS si hubiera un vector de ataque.

**🟡 HALLAZGO MEDIO — Refresh Token en `localStorage`:**
- `auth.service.ts:198`: `response.refresh_token` se guarda en `localStorage` (aunque cifrado con AES). Sin embargo, el `refresh_token` también se envía como HttpOnly Cookie. Hay **duplicación** del token en dos lugares: la cookie y localStorage. Si la cookie es la fuente autoritativa (correcta para MitM), el localStorage debería ignorar el refresh token. Representa superficie de ataque adicional.

---

## 📊 Cuadro de Estado Final

| # | Amenaza | Estado | Evidencia Clave |
|---|---------|--------|-----------------|
| 1 | Man-in-the-Middle | 🟡 Parcial | CORS hardcodeado en código |
| 2 | Acceso No Autorizado | 🟢 Mitigado | Lockout + OTP + Audit Logs |
| 3 | Manipulación IoT (PEF) | 🟢 Mitigado | Pydantic `ge/le` en `SpirometryCreate` |
| 4 | Inyección SQL | 🟢 Mitigado | ORM 100%, sin raw SQL |
| 5 | Session Hijacking | 🔴 Crítico | `temp_2fa_token` en localStorage sin cifrar |

---

## 🎨 Veredicto de Calidad UX/UI

### Hallazgos Identificados

| Área | Estado | Descripción |
|------|--------|-------------|
| **Ícono "Colapsar Sidebar"** | 🔴 Roto | El toggle de la barra lateral izquierda no funciona |
| **Configuración → Guardar** | 🟡 Redundante | Se guarda automáticamente (toast inmediato) Y existe botón de "Guardar Cambios" — contradicción UX |
| **KPI Group Widget** | 🔴 Roto | Solo 2 de 4 KPIs visibles al tamaño de pantalla estándar; breakpoint incorrecto |
| **Drag & Drop Widgets** | 🟡 Inestable | Al arrastrar, el widget se extiende verticalmente o queda pegado a la izquierda |
| **Modo Oscuro** | 🟡 Deficiente | Colores hardcodeados en varios widgets no responden al dark mode |
| **Registro** | 🟡 Visual | Formulario muy alto al alternar con Login; sin animación de transición |
| **Olvidé Contraseña** | 🟡 UX | No lleva pre-cargado el email del campo de Login; experiencia discontinua |
| **Agregar Paciente** | 🟡 Espaciado | Exceso de padding/margen; espacio no aprovechado con campos muy dispersos |
| **Reporte PDF** | 🟡 Diseño | No posee la densidad visual premium del resto del sistema |
| **Calendario** | 🟡 Funcional | Eventos no navegan a detalle; sin vista semanal real |
| **Botones muertos** | 🔴 Múltiples | Ícono de colapso sidebar, botones en widgets sin acción definida |

---

## 🛠️ Roadmap de Remediación (Priorizado)

### CRÍTICO (Antes de Producción)
1. **[SEC-001]** Cifrar `temp_2fa_token` usando `StorageService.setItem()` y eliminarlo con `StorageService.removeItem()`.
2. **[SEC-002]** Mover CORS origins a `settings.CORS_ORIGINS` desde `.env`.

### ALTO (Sprint Siguiente)
3. **[SEC-003]** Agregar regex XSS al validador frontend (`<script`, `onerror=`, `javascript:`).
4. **[UX-001]** Corregir el toggle del sidebar — reconectar el evento `click` al `LayoutService`.
5. **[UX-002]** Corregir visibilidad de 4 KPIs en el widget group — revisar breakpoint `colSpan`.

### MEDIO
6. **[UX-003]** Eliminar el botón "Guardar" en Settings si el autoguardado ya está activo, o deshabilitar el autoguardado para dar control explícito al usuario.
7. **[UX-004]** Pre-cargar email en el flujo "Olvidé mi contraseña" desde el campo de Login.
8. **[UX-005]** Mejorar formulario de Registro con animación `slide/fade` al cambiar entre Login y Register.
9. **[UX-006]** Auditoría completa de modo oscuro — aplicar `dark:` clases Tailwind a todos los widgets.
10. **[UX-007]** Rediseño del Reporte PDF para consistencia visual premium.

---

*Este documento fue generado mediante análisis estático autónomo del repositorio AsmaSync. No se ejecutó código en producción durante la auditoría.*
