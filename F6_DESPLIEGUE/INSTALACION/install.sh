#!/bin/bash
echo "=========================================================="
echo "   INSTALADOR AUTOMATIZADO - ASMASYNC ECOSISTEMA CLINICO  "
echo "=========================================================="

if [ ! -f .env ]; then
    echo "[+] Creando archivo de variables .env desde template..."
    cp .env.example .env
fi

echo "[+] Verificando instalación de Docker y Docker Compose..."
if ! command -v docker &> /dev/null; then
    echo "[!] Error: Docker no está instalado. Por favor instálalo e reintenta."
    exit 1
fi

echo "[+] Construyendo y levantando contenedores..."
docker-compose up -d --build

echo "[+] Esperando inicialización de la base de datos PostgreSQL..."
sleep 10

echo "[+] Ejecutando estado de salud de los servicios..."
docker-compose ps

echo "=========================================================="
echo "   ¡Instalación completada exitosamente!"
echo "   Dashboard Web: http://localhost"
echo "   API FastAPI: http://localhost:8000/docs"
echo "=========================================================="
