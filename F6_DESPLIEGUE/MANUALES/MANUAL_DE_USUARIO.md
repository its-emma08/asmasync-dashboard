# 📘 MANUAL COMPLETO - ASMASYNC DASHBOARD

**Sistema Inteligente de Monitoreo y Predicción de Crisis Asmáticas**

---

## 📋 ÍNDICE

1. [Requisitos del Sistema](#1-requisitos-del-sistema)
2. [Instalación Inicial](#2-instalación-inicial)
3. [Configuración de Base de Datos](#3-configuración-de-base-de-datos)
4. [Configuración del Backend](#4-configuración-del-backend)
5. [Configuración del Frontend](#5-configuración-del-frontend)
6. [Creación de Usuarios](#6-creación-de-usuarios)
7. [Inicio del Sistema](#7-inicio-del-sistema)
8. [Uso del Dashboard](#8-uso-del-dashboard)
9. [Pruebas y Validación](#9-pruebas-y-validación)
10. [Solución de Problemas](#10-solución-de-problemas)
11. [Mantenimiento](#11-mantenimiento)

---

## 1. REQUISITOS DEL SISTEMA

### 1.1 Hardware Mínimo

- **CPU:** Intel i5 o equivalente (2+ cores)
- **RAM:** 8 GB mínimo (16 GB recomendado)
- **Disco:** 10 GB libres
- **Conexión:** Internet estable

### 1.2 Software Necesario

#### **Sistema Operativo:**
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (Ubuntu 20.04+)

#### **Aplicaciones a Instalar:**

**1. Node.js 18+ LTS**
- Descargar: https://nodejs.org/
- Verificar instalación:
  ```bash
  node --version  # Debe mostrar v18.x.x o superior
  npm --version   # Debe mostrar 9.x.x o superior
  ```

**2. Python 3.10+**
- Descargar: https://www.python.org/downloads/
- ⚠️ **IMPORTANTE:** Marcar "Add Python to PATH" durante instalación
- Verificar:
  ```bash
  python --version  # Debe mostrar Python 3.10.x o superior
  pip --version     # Debe mostrar pip 23.x.x o superior
  ```

**3. PostgreSQL 15+**
- Descargar: https://www.postgresql.org/download/
- Durante instalación:
  - Recordar contraseña de usuario `postgres`
  - Puerto: 5432 (default)
  - Locale: Español / UTF-8
- Verificar:
  ```bash
  psql --version  # Debe mostrar PostgreSQL 15.x
  ```

**4. Redis 7+ (Opcional pero recomendado)**

**Opción A - Windows (WSL):**
```bash
# Instalar WSL
wsl --install

# Dentro de WSL Ubuntu:
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

**Opción B - Docker (Recomendado para todos):**
```bash
docker run --name asmasync-redis -p 6379:6379 -d redis:7-alpine
```

Verificar:
```bash
redis-cli ping  # Debe responder: PONG
```

**5. Git**
- Descargar: https://git-scm.com/downloads
- Verificar:
  ```bash
  git --version
  ```

**6. Editor de Código (Recomendado):**
- Visual Studio Code: https://code.visualstudio.com/

---

## 2. INSTALACIÓN INICIAL

### 2.1 Clonar/Obtener el Proyecto

**Si el proyecto está en GitHub:**
```bash
git clone https://github.com/tu-usuario/asmasync-dashboard.git
cd asmasync-dashboard
```

**Si tienes el proyecto en carpeta local:**
```bash
# Navegar a la carpeta
cd c:\asmasync-dashboard
```

### 2.2 Verificar Estructura del Proyecto

```
asmasync-dashboard/
├── backend/
│   ├── app/
│   ├── alembic/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/
│   ├── src/
│   ├── package.json
│   └── README.md
└── README.md
```

---

## 3. CONFIGURACIÓN DE BASE DE DATOS

### 3.1 Crear Base de Datos PostgreSQL

**Opción A - Interfaz Gráfica (pgAdmin):**

1. Abrir pgAdmin 4
2. Click derecho en "Databases" → "Create" → "Database"
3. Configurar:
   - **Database:** `asmasync_db`
   - **Owner:** `postgres`
   - **Encoding:** `UTF8`
4. Click "Save"

**Opción B - Línea de Comandos:**

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE asmasync_db;

# Crear usuario (opcional, más seguro)
CREATE USER asmasync_user WITH PASSWORD 'TuContraseñaSegura123!';

# Dar permisos
GRANT ALL PRIVILEGES ON DATABASE asmasync_db TO asmasync_user;

# Salir
\q
```

### 3.2 Verificar Conexión

```bash
# Conectar a la nueva base de datos
psql -U postgres -d asmasync_db

# Ver tablas (debería estar vacío por ahora)
\dt

# Salir
\q
```

---

## 4. CONFIGURACIÓN DEL BACKEND

### 4.1 Navegar a la Carpeta Backend

```bash
cd backend
```

### 4.2 Crear Entorno Virtual

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Verificar que esté activado:**
```bash
# El prompt debe mostrar (venv) al inicio
(venv) C:\asmasync-dashboard\backend>
```

### 4.3 Instalar Dependencias

```bash
# Actualizar pip
python -m pip install --upgrade pip

# Instalar todas las dependencias
pip install -r requirements.txt
```

**Tiempo estimado:** 3-5 minutos

**Verificar instalación:**
```bash
pip list | findstr fastapi
# Debe mostrar: fastapi  0.109.0 (o superior)
```

### 4.4 Configurar Variables de Entorno

**1. Copiar archivo de ejemplo:**
```bash
copy .env.example .env
```

**2. Editar `.env` con un editor de texto:**

```env
# ========================================
# CONFIGURACIÓN BASE DE DATOS
# ========================================
# Formato: postgresql://usuario:contraseña@host:puerto/nombre_db
DATABASE_URL=postgresql://postgres:TuContraseña@localhost:5432/asmasync_db

# ========================================
# CONFIGURACIÓN REDIS (CACHÉ)
# ========================================
REDIS_URL=redis://localhost:6379/0

# ========================================
# SEGURIDAD (¡MUY IMPORTANTE!)
# ========================================
# Generar clave secreta única (ver instrucciones abajo)
SECRET_KEY=tu-clave-secreta-de-32-caracteres-minimo-aqui

# Algoritmo de encriptación (NO CAMBIAR)
ALGORITHM=HS256

# Tiempo de expiración de tokens
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# ========================================
# CORS (Frontend)
# ========================================
CORS_ORIGINS=["http://localhost:4200"]

# ========================================
# AMBIENTE
# ========================================
ENVIRONMENT=development
DEBUG=true

# ========================================
# API
# ========================================
API_V1_PREFIX=/api/v1
PROJECT_NAME=AsmaSync Backend
VERSION=1.0.0
```

**3. Generar SECRET_KEY única:**

**Opción A - Python (Recomendado):**
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

**Opción B - PowerShell (Windows):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Opción C - OpenSSL:**
```bash
openssl rand -hex 32
```

Copia el resultado y pégalo en `SECRET_KEY` del archivo `.env`

**Ejemplo de SECRET_KEY válida:**
```
SECRET_KEY=a8f3c2e1b9d4f7a6c5e8b2d9f4a7c3e6b1d8f5a2c9e7b4d1f8a5c2e9b6d3f0a7
```

### 4.5 Ejecutar Migraciones de Base de Datos

```bash
# Crear las tablas en la base de datos
alembic upgrade head
```

**Salida esperada:**
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001_initial_medical, Initial migration
```

**Verificar que se crearon las tablas:**
```bash
psql -U postgres -d asmasync_db -c "\dt"
```

**Deberías ver:**
```
             List of relations
 Schema |           Name            | Type  |  Owner   
--------+---------------------------+-------+----------
 public | users                     | table | postgres
 public | patients                  | table | postgres
 public | measurements              | table | postgres
 public | alerts                    | table | postgres
 public | interventions             | table | postgres
 public | audit_logs                | table | postgres
 public | organizations             | table | postgres
 public | hospitals                 | table | postgres
 public | clinical_histories        | table | postgres
 public | physical_exams            | table | postgres
 public | conditions                | table | postgres
 public | allergies                 | table | postgres
```

---

## 5. CONFIGURACIÓN DEL FRONTEND

### 5.1 Navegar a la Carpeta Frontend

```bash
# Desde la raíz del proyecto
cd frontend

# O si estás en backend:
cd ../frontend
```

### 5.2 Instalar Dependencias

```bash
npm install
```

**Tiempo estimado:** 5-10 minutos (primera vez)

**⚠️ Si hay errores de permisos (Windows):**
```bash
npm install --legacy-peer-deps
```

### 5.3 Verificar Configuración de Entorno

**Editar:** `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
  wsUrl: 'ws://localhost:8000/ws'
};
```

**⚠️ IMPORTANTE:** Asegúrate de que `apiUrl` coincida con la URL del backend.

### 5.4 Compilar el Proyecto (Opcional - Para verificar)

```bash
ng build
```

**Si no hay errores, está listo.**

---

## 6. CREACIÓN DE USUARIOS

### 6.1 Usuario Administrador Inicial

**Crear script de seed:** `backend/scripts/seed_initial_users.py`

```python
import sys
import os
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

def create_initial_users():
    """Crea usuarios iniciales para el sistema"""
    db = SessionLocal()
    
    try:
        # ========================================
        # USUARIO 1: SUPER ADMIN
        # ========================================
        admin_email = "admin@asmasync.com"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        
        if not existing_admin:
            admin = User(
                email=admin_email,
                password_hash=hash_password("Admin123!"),
                full_name="Administrador del Sistema",
                role="admin",
                is_active=True,
                last_login=None
            )
            db.add(admin)
            print(f"✅ Usuario ADMIN creado:")
            print(f"   Email: {admin_email}")
            print(f"   Password: Admin123!")
            print(f"   Rol: admin")
        else:
            print(f"ℹ️  Usuario admin ya existe")
        
        # ========================================
        # USUARIO 2: ENFERMERA DE PRUEBA
        # ========================================
        nurse_email = "enfermera@asmasync.com"
        existing_nurse = db.query(User).filter(User.email == nurse_email).first()
        
        if not existing_nurse:
            nurse = User(
                email=nurse_email,
                password_hash=hash_password("Nurse123!"),
                full_name="María González López",
                role="nurse",
                is_active=True,
                last_login=None
            )
            db.add(nurse)
            print(f"\n✅ Usuario ENFERMERA creado:")
            print(f"   Email: {nurse_email}")
            print(f"   Password: Nurse123!")
            print(f"   Rol: nurse")
        else:
            print(f"\nℹ️  Usuario enfermera ya existe")
        
        # ========================================
        # USUARIO 3: MÉDICO DE PRUEBA
        # ========================================
        doctor_email = "doctor@asmasync.com"
        existing_doctor = db.query(User).filter(User.email == doctor_email).first()
        
        if not existing_doctor:
            doctor = User(
                email=doctor_email,
                password_hash=hash_password("Doctor123!"),
                full_name="Dr. Juan Pérez Martínez",
                role="doctor",
                is_active=True,
                last_login=None
            )
            db.add(doctor)
            print(f"\n✅ Usuario MÉDICO creado:")
            print(f"   Email: {doctor_email}")
            print(f"   Password: Doctor123!")
            print(f"   Rol: doctor")
        else:
            print(f"\nℹ️  Usuario médico ya existe")
        
        # Guardar cambios
        db.commit()
        
        print("\n" + "="*60)
        print("✅ USUARIOS INICIALES CREADOS EXITOSAMENTE")
        print("="*60)
        print("\nPuedes iniciar sesión con cualquiera de estos usuarios:")
        print("\n1. ADMIN:")
        print("   Email: admin@asmasync.com")
        print("   Pass:  Admin123!")
        print("\n2. ENFERMERA:")
        print("   Email: enfermera@asmasync.com")
        print("   Pass:  Nurse123!")
        print("\n3. MÉDICO:")
        print("   Email: doctor@asmasync.com")
        print("   Pass:  Doctor123!")
        print("\n" + "="*60)
        
    except Exception as e:
        print(f"\n❌ Error al crear usuarios: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_users()
```

**Ejecutar el script:**

```bash
# Asegúrate de estar en la carpeta backend con venv activado
(venv) backend> python scripts/seed_initial_users.py
```

**Salida esperada:**
```
✅ Usuario ADMIN creado:
   Email: admin@asmasync.com
   Password: Admin123!
   Rol: admin

✅ Usuario ENFERMERA creado:
   Email: enfermera@asmasync.com
   Password: Nurse123!
   Rol: nurse

✅ Usuario MÉDICO creado:
   Email: doctor@asmasync.com
   Password: Doctor123!
   Rol: doctor

============================================================
✅ USUARIOS INICIALES CREADOS EXITOSAMENTE
============================================================
```

### 6.2 Pacientes de Prueba

**Crear script:** `backend/scripts/seed_demo_patients.py`

```python
import sys
import os
from datetime import datetime, timedelta
import random

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models.patient import Patient
from app.models.measurement import Measurement

def create_demo_patients():
    """Crea pacientes de demostración con datos realistas"""
    db = SessionLocal()
    
    demo_patients = [
        {
            "full_name": "María García López",
            "email": "maria.garcia@example.com",
            "age": 34,
            "gender": "F",
            "personal_best_pef": 450,
            "risk_level": "red",
            "last_crisis_date": datetime.now() - timedelta(days=2)
        },
        {
            "full_name": "Juan Pérez Sánchez",
            "email": "juan.perez@example.com",
            "age": 28,
            "gender": "M",
            "personal_best_pef": 520,
            "risk_level": "yellow",
            "last_crisis_date": datetime.now() - timedelta(days=15)
        },
        {
            "full_name": "Ana Martínez Rodríguez",
            "email": "ana.martinez@example.com",
            "age": 42,
            "gender": "F",
            "personal_best_pef": 420,
            "risk_level": "green",
            "last_crisis_date": datetime.now() - timedelta(days=60)
        },
        {
            "full_name": "Carlos Hernández Torres",
            "email": "carlos.hernandez@example.com",
            "age": 19,
            "gender": "M",
            "personal_best_pef": 580,
            "risk_level": "yellow",
            "last_crisis_date": datetime.now() - timedelta(days=20)
        },
        {
            "full_name": "Laura Ramírez Cruz",
            "email": "laura.ramirez@example.com",
            "age": 55,
            "gender": "F",
            "personal_best_pef": 380,
            "risk_level": "red",
            "last_crisis_date": datetime.now() - timedelta(days=5)
        }
    ]
    
    try:
        for patient_data in demo_patients:
            # Verificar si ya existe
            existing = db.query(Patient).filter(
                Patient.email == patient_data["email"]
            ).first()
            
            if existing:
                print(f"ℹ️  Paciente {patient_data['full_name']} ya existe")
                continue
            
            # Crear paciente
            patient = Patient(**patient_data)
            db.add(patient)
            db.flush()  # Para obtener el ID
            
            # Crear mediciones de los últimos 7 días
            for days_ago in range(7, 0, -1):
                measurement_date = datetime.now() - timedelta(days=days_ago)
                
                # FEM con variación según nivel de riesgo
                base_pef = patient_data["personal_best_pef"]
                if patient_data["risk_level"] == "red":
                    pef_value = base_pef * random.uniform(0.50, 0.65)
                    zone = "red"
                elif patient_data["risk_level"] == "yellow":
                    pef_value = base_pef * random.uniform(0.65, 0.85)
                    zone = "yellow"
                else:
                    pef_value = base_pef * random.uniform(0.85, 1.00)
                    zone = "green"
                
                measurement = Measurement(
                    patient_id=patient.id,
                    measurement_type="pef",
                    value=round(pef_value, 1),
                    measured_at=measurement_date,
                    zone=zone
                )
                db.add(measurement)
            
            print(f"✅ Paciente creado: {patient_data['full_name']} (Riesgo: {patient_data['risk_level']})")
        
        db.commit()
        print("\n" + "="*60)
        print("✅ PACIENTES DE DEMOSTRACIÓN CREADOS")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_patients()
```

**Ejecutar:**
```bash
python scripts/seed_demo_patients.py
```

---

## 7. INICIO DEL SISTEMA

### 7.1 Iniciar Backend

**Terminal 1 - Backend:**

```bash
# Navegar a backend
cd backend

# Activar entorno virtual
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux

# Iniciar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Salida esperada:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using StatReload
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Verificar que funciona:**
- Abrir navegador: http://localhost:8000/docs
- Deberías ver la documentación Swagger UI

### 7.2 Iniciar Frontend

**Terminal 2 - Frontend:**

```bash
# Navegar a frontend (nueva terminal)
cd frontend

# Iniciar servidor de desarrollo
ng serve -o
```

**Salida esperada:**
```
✔ Browser application bundle generation complete.

Initial Chunk Files   | Names         |  Raw Size
main.js              | main          | 2.50 MB   
polyfills.js         | polyfills     |   90.20 kB

                     | Initial Total | 2.59 MB

Build at: 2026-02-05T12:00:00.000Z - Hash: abc123def456
** Angular Live Development Server is listening on localhost:4200, open your browser on http://localhost:4200/ **
✔ Compiled successfully.
```

**El navegador debería abrirse automáticamente en:**
http://localhost:4200/login

---

## 8. USO DEL DASHBOARD

### 8.1 Primera Vez - Inicio de Sesión

**URL:** http://localhost:4200/login

**Credenciales de prueba:**

**OPCIÓN 1 - Admin:**
```
Email: admin@asmasync.com
Contraseña: Admin123!
```

**OPCIÓN 2 - Enfermera:**
```
Email: enfermera@asmasync.com
Contraseña: Nurse123!
```

**OPCIÓN 3 - Médico:**
```
Email: doctor@asmasync.com
Contraseña: Doctor123!
```

**Pasos:**
1. Ingresar email
2. Ingresar contraseña
3. Click en "INICIAR SESIÓN"
4. Deberías ser redirigido a `/dashboard`

**⚠️ Si hay error "Credenciales incorrectas":**
- Verificar que ejecutaste `seed_initial_users.py`
- Verificar que el backend esté corriendo
- Ver consola del navegador (F12) para errores

### 8.2 Dashboard Principal

**URL:** http://localhost:4200/dashboard

**Elementos visibles:**

**1. Navbar (Arriba):**
- Logo AsmaSync
- Título
- Badge de alertas (número en rojo)
- Avatar de usuario
- Menú desplegable:
  - Mi Perfil
  - Configuración
  - Cerrar Sesión

**2. Sidebar (Izquierda):**
- 🏠 **Dashboard** - Vista principal
- 👥 **Pacientes** - Lista completa
- 🚨 **Alertas** - Notificaciones
- 📊 **Reportes** - Generación de PDFs

**3. Contenido Principal:**

**A) KPI Cards (4 tarjetas):**
- **Total Pacientes** (azul) - Número total en sistema
- **Alertas Críticas** (rojo) - Pacientes en riesgo alto
- **Riesgo Moderado** (amarillo) - Pacientes en precaución
- **Intervenciones Hoy** (verde) - Acciones registradas hoy

**B) Gráfico de Distribución:**
- Gráfico de barras con pacientes por nivel de riesgo
- Colores semáforo:
  - Verde: Riesgo bajo
  - Amarillo: Riesgo moderado
  - Rojo: Riesgo alto

**C) Tabla de Pacientes Prioritarios:**
- Top 5 pacientes que requieren atención
- Columnas:
  - Nombre
  - Riesgo (badge con color)
  - FEM actual
  - Última actualización
  - Acciones (botón "Ver Detalle")

### 8.3 Lista de Pacientes

**Ruta:** Click en "Pacientes" en sidebar

**URL:** http://localhost:4200/dashboard/patients

**Funcionalidades:**

**1. Barra de Búsqueda:**
- Buscar por nombre
- Actualización en tiempo real (debounce 300ms)

**2. Filtros:**
- Dropdown "Nivel de Riesgo":
  - Todos
  - Verde (Bajo)
  - Amarillo (Moderado)
  - Rojo (Alto)
- Botón "Limpiar Filtros"

**3. Tabla de Pacientes:**
- **Columnas:**
  - ID
  - Nombre
  - Edad
  - Riesgo (badge)
  - FEM Actual
  - SpO2
  - Última Actualización
  - Acciones

**4. Paginación:**
- 10, 25 o 50 pacientes por página
- Navegación entre páginas

**5. Ordenamiento:**
- Click en encabezados para ordenar
- Indicador de ordenamiento (↑ ↓)

**Acciones por Paciente:**
- 👁️ **Ver Detalle** - Ir a vista completa
- ✏️ **Editar** (si tienes permisos)
- 🗑️ **Eliminar** (solo admin)

### 8.4 Vista Detallada de Paciente

**Ruta:** Click en "Ver Detalle" de cualquier paciente

**URL:** http://localhost:4200/dashboard/patients/1

**Secciones:**

**1. Header del Paciente:**
- Avatar con iniciales
- Nombre completo
- Edad, sexo, ID
- Badge grande de riesgo actual
- Fecha de última crisis
- FAB (botón flotante) "Registrar Intervención"

**2. Panel de Métricas Vitales:**

**A) FEM (Flujo Espiratorio Máximo):**
- Valor actual
- Mejor personal
- Porcentaje (Actual / Mejor Personal × 100)
- Barra de progreso con colores:
  - Verde: ≥80%
  - Amarillo: 50-79%
  - Rojo: <50%

**B) SpO2 (Saturación de Oxígeno):**
- Valor actual (%)
- Indicador de color:
  - Verde: ≥95%
  - Amarillo: 90-94%
  - Rojo: <90%

**C) Frecuencia Respiratoria:**
- Valor actual (respiraciones/min)

**3. Gráfico de Tendencia FEM:**
- Line chart de últimos 7 días
- Líneas de referencia:
  - Verde: 80% del mejor personal
  - Amarilla: 50%
  - Zona roja: <50%
- Tooltips al pasar el mouse:
  - Fecha
  - Valor de FEM
  - Zona de riesgo

**4. Timeline de Síntomas:**
- Lista vertical ordenada por fecha
- Íconos por tipo:
  - 🫁 Tos
  - 💨 Sibilancias
  - 😮💨 Dificultad para respirar
  - 💊 Uso de rescate
- Severidad con colores (leve/moderada/severa)

**5. Historial de Crisis:**
- Tabla con últimas 5 crisis
- Columnas:
  - Fecha
  - Severidad
  - Hospitalización (Sí/No)
  - Duración (horas)
  - Desencadenante

**6. Pestañas Adicionales (si implementadas):**
- 📋 Historia Clínica
- 💊 Medicamentos
- 🧪 Estudios de Laboratorio
- 📝 Intervenciones

### 8.5 Panel de Alertas

**Ruta:** Click en "Alertas" en sidebar

**URL:** http://localhost:4200/dashboard/alerts

**Funcionalidades:**

**1. Toolbar:**
- Filtros rápidos:
  - Todas
  - Críticas (rojas)
  - Moderadas (amarillas)
  - No Vistas

**2. Lista de Alertas:**
- Orden: Más recientes primero
- Cada alerta muestra:
  - Ícono según severidad (⚠️ ⚡)
  - Nombre del paciente
  - Tipo de alerta
  - Mensaje descriptivo
  - Timestamp relativo ("hace 5 minutos")
  - Estado (vista/no vista)
  
**3. Acciones:**
- 👁️ **Marcar como Vista** - Cambia color a gris
- 👤 **Ver Paciente** - Navega a detalle del paciente
- 🗑️ **Eliminar** - Quita la alerta

**4. Notificaciones en Tiempo Real:**
- WebSocket activo
- Nuevas alertas aparecen automáticamente
- Sonido de notificación (opcional)
- Badge en navbar se actualiza

### 8.6 Registrar Intervención

**Ruta:** FAB en vista de paciente o menú de acciones

**URL:** Modal/Dialog

**Formulario:**

**1. Paciente:**
- Selector con autocompletar
- Búsqueda por nombre

**2. Tipo de Intervención:**
- Dropdown con opciones:
  - Consejería Telefónica
  - Ajuste de Plan de Acción
  - Educación sobre Técnica de Inhalador
  - Evaluación de Adherencia
  - Otro

**3. Descripción:**
- Textarea (20-500 caracteres)
- Descripción detallada de la intervención

**4. Recomendaciones:**
- Textarea (10-300 caracteres)
- Indicaciones para el paciente

**5. Próximo Seguimiento:**
- Date picker
- No puede ser fecha pasada

**Validaciones:**
- Todos los campos obligatorios
- Límites de caracteres
- Fecha futura

**Al Guardar:**
1. Validación
2. Envío a backend
3. Dialog de confirmación:
   - Ícono ✅
   - Resumen de intervención
   - Botones:
     - "Ver Paciente"
     - "Nueva Intervención"
     - "Cerrar"

### 8.7 Generar Reportes

**Ruta:** Click en "Reportes" en sidebar

**URL:** http://localhost:4200/dashboard/reports

**Tipos de Reportes:**

**1. Reporte Individual de Paciente:**
- Seleccionar paciente
- Rango de fechas (opcional)
- Incluye:
  - Datos demográficos
  - Gráfico de tendencia FEM
  - Tabla de crisis
  - Lista de intervenciones

**2. Reporte Semanal de Actividad:**
- Rango de fechas (última semana default)
- Incluye:
  - Total de consultas
  - Pacientes nuevos
  - Intervenciones realizadas
  - Alertas generadas

**3. Reporte de Adherencia:**
- Por paciente o general
- Incluye:
  - Porcentaje de adherencia
  - Medicamentos prescritos vs tomados
  - Gráfico de tendencia

**Configuración:**
- Vista Previa (antes de descargar)
- Botón "Descargar PDF"
- Formato: A4, logo AsmaSync, paginación

---

## 9. PRUEBAS Y VALIDACIÓN

### 9.1 Checklist de Pruebas Básicas

**Copiar esta lista y marcar cada prueba:**

#### ✅ AUTENTICACIÓN

- [ ] Login con usuario admin funciona
- [ ] Login con usuario enfermera funciona
- [ ] Login con usuario médico funciona
- [ ] Login con credenciales incorrectas muestra error
- [ ] Auto-logout tras 15 min de inactividad funciona
- [ ] Cerrar sesión funciona correctamente
- [ ] No se puede acceder a /dashboard sin login

#### ✅ DASHBOARD

- [ ] KPIs muestran números correctos
- [ ] Gráfico de distribución se renderiza
- [ ] Tabla de pacientes prioritarios muestra datos
- [ ] Badge de alertas muestra número correcto
- [ ] Navegación entre secciones funciona

#### ✅ PACIENTES

- [ ] Lista de pacientes carga correctamente
- [ ] Búsqueda por nombre funciona
- [ ] Filtro por nivel de riesgo funciona
- [ ] Paginación funciona (cambiar de página)
- [ ] Ordenamiento por columnas funciona
- [ ] Vista detallada de paciente carga
- [ ] Gráfico de tendencia FEM se muestra
- [ ] Timeline de síntomas aparece

#### ✅ ALERTAS

- [ ] Lista de alertas carga
- [ ] Filtros funcionan (todas/críticas/no vistas)
- [ ] Marcar alerta como vista funciona
- [ ] Badge en navbar se actualiza
- [ ] Click en "Ver Paciente" navega correctamente

#### ✅ INTERVENCIONES

- [ ] Modal/dialog se abre
- [ ] Formulario valida campos obligatorios
- [ ] Formulario valida longitudes de texto
- [ ] Date picker no permite fechas pasadas
- [ ] Guardar intervención funciona
- [ ] Dialog de confirmación aparece
- [ ] Intervención se muestra en historial del paciente

#### ✅ REPORTES

- [ ] Selector de tipo de reporte funciona
- [ ] Vista previa se genera
- [ ] PDF se descarga correctamente
- [ ] PDF contiene información correcta

#### ✅ RENDIMIENTO

- [ ] Dashboard carga en <2 segundos
- [ ] Navegación entre páginas es fluida
- [ ] Sin errores en consola del navegador (F12)
- [ ] Backend responde en <500ms (ver Network tab)

### 9.2 Pruebas Avanzadas (Opcional)

**WebSocket (Tiempo Real):**

**Test Manual:**
1. Abrir dos navegadores en http://localhost:4200
2. Iniciar sesión en ambos
3. En el primero, crear una alerta (o modificar paciente)
4. Verificar que el segundo navegador se actualice automáticamente

**API Directa (Swagger):**
1. Ir a http://localhost:8000/docs
2. Probar endpoint POST /auth/login
3. Copiar access_token
4. Click en "Authorize" (candado)
5. Pegar token
6. Probar GET /patients
7. Verificar que responde con JSON de pacientes

**Base de Datos:**
```sql
-- Conectar a PostgreSQL
psql -U postgres -d asmasync_db

-- Ver usuarios creados
SELECT id, email, full_name, role, is_active FROM users;

-- Ver pacientes
SELECT id, full_name, age, risk_level FROM patients;

-- Ver mediciones de un paciente
SELECT patient_id, measurement_type, value, measured_at, zone 
FROM measurements 
WHERE patient_id = 1 
ORDER BY measured_at DESC 
LIMIT 10;

-- Salir
\q
```

### 9.3 Datos de Prueba Adicionales

**Si necesitas más pacientes:**

```bash
# Ejecutar nuevamente el script
python scripts/seed_demo_patients.py
```

**Modificar manualmente un paciente a riesgo alto:**

```sql
psql -U postgres -d asmasync_db

UPDATE patients 
SET risk_level = 'red', 
    last_crisis_date = CURRENT_TIMESTAMP 
WHERE id = 1;
```

**Crear alerta manual:**

```sql
INSERT INTO alerts (patient_id, alert_type, message, is_viewed)
VALUES (1, 'critical', 'FEM bajo 60% del mejor valor personal', false);
```

---

## 10. SOLUCIÓN DE PROBLEMAS

### 10.1 Backend No Inicia

**Síntoma:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solución:**
```bash
# Verificar que venv esté activado
# Debe mostrar (venv) al inicio del prompt

# Reinstalar dependencias
pip install -r requirements.txt
```

---

**Síntoma:**
```
sqlalchemy.exc.OperationalError: FATAL: password authentication failed
```

**Solución:**
1. Verificar `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA_CORRECTA@localhost:5432/asmasync_db
   ```
2. Verificar que PostgreSQL esté corriendo:
   ```bash
   # Windows
   sc query postgresql-x64-15
   
   # Mac/Linux
   pg_ctl status
   ```

---

**Síntoma:**
```
redis.exceptions.ConnectionError: Error connecting to Redis
```

**Solución:**
```bash
# Si usas Docker
docker start asmasync-redis

# Si usas WSL
sudo service redis-server start

# Verificar
redis-cli ping
# Debe responder: PONG
```

### 10.2 Frontend No Inicia

**Síntoma:**
```
Error: Cannot find module '@angular/core'
```

**Solución:**
```bash
# Limpiar e instalar
rm -rf node_modules package-lock.json
npm install
```

---

**Síntoma:**
```
Port 4200 is already in use.
```

**Solución:**
```bash
# Opción 1: Usar otro puerto
ng serve --port 4201

# Opción 2: Matar proceso
# Windows
netstat -ano | findstr :4200
taskkill /PID [número_de_PID] /F

# Mac/Linux
lsof -ti:4200 | xargs kill -9
```

### 10.3 Errores de Login

**Síntoma:**
Login muestra "Credenciales incorrectas" con usuarios correctos

**Diagnóstico:**
1. Abrir consola del navegador (F12)
2. Ver pestaña "Network"
3. Intentar login
4. Ver respuesta del POST a /auth/login

**Posibles causas:**

**A) Backend no está corriendo:**
- Status: ERR_CONNECTION_REFUSED
- Solución: Iniciar backend (`uvicorn app.main:app --reload`)

**B) CORS bloqueado:**
- Error en consola: "CORS policy: No 'Access-Control-Allow-Origin'"
- Solución: Verificar `CORS_ORIGINS` en backend/.env

**C) Usuario no existe en BD:**
```bash
# Verificar en BD
psql -U postgres -d asmasync_db -c "SELECT email, role FROM users;"

# Si no hay usuarios, ejecutar seed
python scripts/seed_initial_users.py
```

### 10.4 Dashboard No Muestra Datos

**Síntoma:**
Dashboard carga pero KPIs muestran 0 o "No hay pacientes"

**Solución:**
```bash
# Crear pacientes de prueba
python scripts/seed_demo_patients.py

# Verificar en BD
psql -U postgres -d asmasync_db -c "SELECT COUNT(*) FROM patients;"
```

### 10.5 WebSocket No Conecta

**Síntoma:**
Alertas no aparecen en tiempo real

**Diagnóstico:**
1. Abrir consola (F12)
2. Ver pestaña "Console"
3. Buscar errores de WebSocket

**Solución:**
Verificar `wsUrl` en `frontend/src/environments/environment.ts`:
```typescript
wsUrl: 'ws://localhost:8000/ws'  // NO wss:// en desarrollo
```

### 10.6 Errores de Migración

**Síntoma:**
```
alembic.util.exc.CommandError: Target database is not up to date.
```

**Solución:**
```bash
# Ver estado actual
alembic current

# Ver historial
alembic history

# Aplicar todas las migraciones
alembic upgrade head
```

---

**Síntoma:**
Alembic no detecta cambios en modelos

**Solución:**
```bash
# Generar migración manualmente
alembic revision --autogenerate -m "Descripción del cambio"

# Revisar archivo generado en alembic/versions/

# Aplicar
alembic upgrade head
```

---

## 11. MANTENIMIENTO

### 11.1 Backup de Base de Datos

**Crear backup:**
```bash
# Backup completo
pg_dump -U postgres -d asmasync_db -F c -b -v -f "backup_asmasync_$(date +%Y%m%d).dump"

# Solo datos (sin esquema)
pg_dump -U postgres -d asmasync_db --data-only -f "backup_data_$(date +%Y%m%d).sql"
```

**Restaurar backup:**
```bash
pg_restore -U postgres -d asmasync_db -v "backup_asmasync_20260205.dump"
```

### 11.2 Limpiar Datos de Prueba

**Eliminar todos los pacientes de prueba:**
```sql
psql -U postgres -d asmasync_db

-- Eliminar mediciones primero (FK constraint)
DELETE FROM measurements WHERE patient_id IN (
    SELECT id FROM patients WHERE email LIKE '%@example.com'
);

-- Eliminar pacientes
DELETE FROM patients WHERE email LIKE '%@example.com';

-- Verificar
SELECT COUNT(*) FROM patients;
```

### 11.3 Actualizar Dependencias

**Backend:**
```bash
cd backend
source venv/bin/activate  # o venv\Scripts\activate en Windows

# Ver dependencias desactualizadas
pip list --outdated

# Actualizar todas
pip install --upgrade -r requirements.txt

# Generar nuevo requirements.txt
pip freeze > requirements.txt
```

**Frontend:**
```bash
cd frontend

# Ver dependencias desactualizadas
npm outdated

# Actualizar todas (cuidado, puede romper cosas)
npm update

# Actualizar una específica
npm install @angular/core@latest
```

### 11.4 Logs y Monitoreo

**Logs del Backend:**
```bash
# Ver logs en tiempo real
tail -f backend/logs/app.log  # Si configuraste logging a archivo

# Buscar errores
grep "ERROR" backend/logs/app.log
```

**Logs de PostgreSQL:**
```bash
# Windows
type "C:\Program Files\PostgreSQL\15\data\log\postgresql-*.log"

# Mac/Linux
tail -f /var/log/postgresql/postgresql-15-main.log
```

**Monitoreo de Performance:**
```sql
-- Ver queries lentas
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;
```

### 11.5 Seguridad - Cambiar Contraseñas

**Cambiar contraseña de usuario admin:**

**Opción A - Script Python:**
```python
# backend/scripts/change_password.py
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

db = SessionLocal()
user = db.query(User).filter(User.email == "admin@asmasync.com").first()
user.password_hash = hash_password("NuevaContraseña123!")
db.commit()
print("✅ Contraseña actualizada")
```

**Opción B - SQL Directo:**
```sql
-- Generar hash primero con Python:
-- python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('NuevaPassword123!'))"

UPDATE users 
SET password_hash = '$2b$12$...' 
WHERE email = 'admin@asmasync.com';
```

---

## 12. ACCESOS RÁPIDOS

### 12.1 URLs del Sistema

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | http://localhost:4200 | Dashboard principal |
| **Login** | http://localhost:4200/login | Página de inicio de sesión |
| **Backend API** | http://localhost:8000 | API REST |
| **Swagger UI** | http://localhost:8000/docs | Documentación interactiva |
| **ReDoc** | http://localhost:8000/redoc | Documentación legible |
| **OpenAPI JSON** | http://localhost:8000/openapi.json | Esquema de la API |

### 12.2 Comandos Frecuentes

**Iniciar todo (desde raíz del proyecto):**

**Windows (PowerShell):**
```powershell
# Terminal 1 - Backend
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
ng serve -o
```

**Mac/Linux:**
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
ng serve -o
```

**Detener todo:**
- Backend: `Ctrl + C` en terminal del backend
- Frontend: `Ctrl + C` en terminal del frontend

**Reiniciar servicios:**
```bash
# PostgreSQL
# Windows
net stop postgresql-x64-15
net start postgresql-x64-15

# Mac/Linux
sudo service postgresql restart

# Redis (Docker)
docker restart asmasync-redis
```

### 12.3 Credenciales de Usuarios de Prueba

```
ADMIN:
Email: admin@asmasync.com
Pass:  Admin123!
Permisos: Todos

ENFERMERA:
Email: enfermera@asmasync.com
Pass:  Nurse123!
Permisos: Ver pacientes, crear intervenciones

MÉDICO:
Email: doctor@asmasync.com
Pass:  Doctor123!
Permisos: Ver pacientes, crear diagnósticos, prescripciones
```

---

## 13. CONTACTO Y SOPORTE

### 13.1 Equipo de Desarrollo
### 13.2 Reportar Problemas

**Si encuentras un error:**
1. Captura de pantalla del error
2. Descripción de qué estabas haciendo
3. Logs de consola (F12 → Console)
4. Enviar por email o WhatsApp al equipo

---

## 14. CHECKLIST DE INSTALACIÓN COMPLETA

**Marca cada paso al completarlo:**

### FASE 1: INSTALACIÓN DE HERRAMIENTAS
- [ ] Node.js 18+ instalado y verificado
- [ ] Python 3.10+ instalado y verificado
- [ ] PostgreSQL 15+ instalado y verificado
- [ ] Redis 7+ instalado/Docker corriendo
- [ ] Git instalado

### FASE 2: CONFIGURACIÓN DE BASE DE DATOS
- [ ] Base de datos `asmasync_db` creada
- [ ] Usuario PostgreSQL configurado
- [ ] Conexión a BD verificada con psql

### FASE 3: BACKEND
- [ ] Carpeta backend navegada
- [ ] Entorno virtual creado
- [ ] Dependencias instaladas (pip install -r requirements.txt)
- [ ] Archivo .env configurado con SECRET_KEY única
- [ ] Migraciones ejecutadas (alembic upgrade head)
- [ ] Tablas verificadas en PostgreSQL
- [ ] Usuarios iniciales creados (seed_initial_users.py)
- [ ] Pacientes de prueba creados (seed_demo_patients.py)
- [ ] Backend inicia sin errores
- [ ] Swagger UI accesible en http://localhost:8000/docs

### FASE 4: FRONTEND
- [ ] Carpeta frontend navegada
- [ ] Dependencias instaladas (npm install)
- [ ] Archivo environment.ts verificado
- [ ] Frontend compila sin errores (ng serve)
- [ ] Login accesible en http://localhost:4200/login

### FASE 5: VALIDACIÓN
- [ ] Login exitoso con admin@asmasync.com
- [ ] Dashboard carga y muestra KPIs
- [ ] Lista de pacientes muestra 5 pacientes de prueba
- [ ] Vista detallada de paciente funciona
- [ ] Gráfico de tendencia FEM se renderiza
- [ ] Panel de alertas carga
- [ ] WebSocket conecta (ver consola sin errores)

### FASE 6: PRUEBAS FUNCIONALES
- [ ] Búsqueda de pacientes funciona
- [ ] Filtros por riesgo funcionan
- [ ] Crear intervención funciona
- [ ] Marcar alerta como vista funciona
- [ ] Logout funciona
- [ ] Auto-logout tras inactividad funciona

**✅ SI TODOS LOS CHECKS ESTÁN MARCADOS: SISTEMA LISTO PARA USAR**

---

## 15. GLOSARIO DE TÉRMINOS

| Término | Significado |
|---------|-------------|
| **FEM/PEF** | Flujo Espiratorio Máximo - Medida de función pulmonar |
| **SpO2** | Saturación de Oxígeno en sangre (%) |
| **JWT** | JSON Web Token - Token de autenticación |
| **API** | Application Programming Interface |
| **ORM** | Object-Relational Mapping |
| **CRUD** | Create, Read, Update, Delete |
| **SPA** | Single Page Application |
| **WebSocket** | Protocolo de comunicación bidireccional en tiempo real |
| **Semáforo de Riesgo** | Sistema verde/amarillo/rojo para clasificar pacientes |
| **venv** | Virtual Environment - Entorno virtual de Python |
| **Migración** | Script para cambiar esquema de base de datos |
| **Seed** | Script para poblar BD con datos iniciales |

---

## 16. PRÓXIMOS PASOS

Una vez que el sistema esté funcionando:

1. **Personalización:**
   - Cambiar logo en `frontend/src/assets/`
   - Modificar colores en `frontend/src/styles.scss`
   - Agregar hospitales en `/dashboard/hospitals`

2. **Datos Reales:**
   - Importar pacientes reales (crear script de importación)
   - Conectar sensores Bluetooth reales
   - Entrenar modelo ML con datos históricos

3. **Deployment:**
   - Configurar servidor de producción (AWS/Azure/GCP)
   - Configurar HTTPS con certificado SSL
   - Configurar dominio personalizado (asmasync.com)

4. **Optimización:**
   - Implementar caché Redis completo
   - Optimizar queries de base de datos
   - Configurar CDN para assets

---

**¡Sistema AsmaSync Listo! 🎉**

**Fecha de este manual:** 05 de Febrero de 2026  
**Versión del sistema:** 1.0.0  
**Universidad Tecnológica del Centro de Veracruz**

---

**Notas finales:**
- Guarda este manual en un lugar accesible
- Compártelo con todos los miembros del equipo
- Actualízalo cuando hagas cambios importantes
- Usa el checklist cada vez que instales en una máquina nueva

**¡Éxito con tu proyecto! 💪🚀**
