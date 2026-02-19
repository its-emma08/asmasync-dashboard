# AsmaSync Dashboard - Deployment

## Requisitos Previos
- Node.js v18+
- Angular CLI v17+

## Build de Producción
Para generar los archivos optimizados para producción:
```bash
ng build --configuration production
```
Esto generará los archivos en la carpeta `dist/dashboard`.

## Despliegue en Servidor (Nginx recomendado)

Configuración básica para Nginx:

```nginx
server {
  listen 80;
  server_name dashboard.asmasync.com;
  
  root /var/www/asmasync-dashboard/dist/dashboard;
  index index.html;
  
  location / {
    try_files $uri $uri/ /index.html;
  }
  
  # Proxy para API
  location /api {
    proxy_pass https://api.asmasync.com;
  }
  
  # Proxy para WebSockets
  location /ws {
    proxy_pass https://api.asmasync.com;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

## Despliegue en Apache
Si usas Apache, asegúrate de copiar el archivo `.htaccess` ubicado en `src/` a la carpeta de distribución si no se copia automáticamente, o configúralo en el servidor.
