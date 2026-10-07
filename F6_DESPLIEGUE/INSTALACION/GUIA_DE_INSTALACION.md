# 🛠️ GUÍA OFICIAL DE INSTALACIÓN Y DESPLIEGUE — ASMASYNC

**Sistema Inteligente de Monitoreo Clínico y Predicción del Asma**  
**Universidad Tecnológica del Centro de Veracruz (UTCV)**

---

## 📋 REQUISITOS PREVIOS DEL SISTEMA

### Hardware Mínimo:
- **CPU:** Dual-core 2.0 GHz o superior.
- **RAM:** 8 GB mínimo (16 GB recomendado para contenedores).
- **Almacenamiento:** 15 GB de espacio libre en disco.

### Software Requerido:
1. **Docker Desktop 4.20+** (incluye Docker Compose v2).
2. **Git 2.40+**
3. **Navegador Web Moderno** (Google Chrome, Mozilla Firefox, Microsoft Edge).

---

## 🚀 PASOS DE INSTALACIÓN PASO A PASO

### Paso 1: Clonar el Repositorio
```bash
git clone https://github.com/its-emma08/asmasync-dashboard.git
cd asmasync-dashboard/F6_DESPLIEGUE/INSTALACION
```

### Paso 2: Configurar las Variables de Entorno
Copiar el archivo de plantilla `.env.example` para crear el archivo `.env`:
```bash
cp .env.example .env
```
*Ajustar las claves secretas y contraseñas de PostgreSQL según los requerimientos del entorno.*

### Paso 3: Ejecución Automatizada del Despliegue

**En Linux / macOS:**
```bash
chmod +x install.sh
./install.sh
```

**En Windows (PowerShell / CMD):**
```cmd
install.bat
```

---

## 🔍 VERIFICACIÓN DE LA INSTALACIÓN

Una vez finalizado el proceso de orquestación, ingresar a los siguientes enlaces para validar el funcionamiento:
- **Dashboard Web (Angular):** `http://localhost`
- **Documentación Interactiva de la API (Swagger UI):** `http://localhost:8000/docs`
- **Estado de Salud de los Servicios:**
```bash
docker-compose ps
```

---

## 🛡️ SOLUCIÓN DE PROBLEMAS FRECUENTES

1. **Error: Puerto 5432 o 80 en uso:**
   - Detener servicios locales de PostgreSQL o NGINX/Apache que puedan estar ocupando los puertos.
2. **Error de Conexión a la Base de Datos:**
   - Verificar los registros del contenedor: `docker logs asmasync_postgres`
