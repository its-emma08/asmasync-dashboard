@echo off
echo ==========================================================
echo    INSTALADOR AUTOMATIZADO - ASMASYNC ECOSISTEMA CLINICO  
echo ==========================================================

if not exist .env (
    echo [+] Creando archivo de variables .env desde template...
    copy .env.example .env
)

echo [+] Verificando Docker Desktop...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Error: Docker no esta ejecutandose o no esta instalado.
    pause
    exit /b 1
)

echo [+] Construyendo y levantando contenedores Docker...
docker-compose up -d --build

echo [+] Esperando 10 segundos para inicializacion de servicios...
timeout /t 10 /nobreak >nul

echo [+] Verificando estado del clúster...
docker-compose ps

echo ==========================================================
echo    ¡Instalacion completada exitosamente!
echo    Dashboard Web: http://localhost
echo    API FastAPI: http://localhost:8000/docs
echo ==========================================================
pause
