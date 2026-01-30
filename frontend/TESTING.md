# Checklist de Pruebas Manuales - AsmaSync Dashboard

## Autenticación
- [ ] Login con credenciales válidas funciona
- [ ] Login con credenciales inválidas muestra error
- [ ] Token se guarda en sessionStorage (NO localStorage)
- [ ] Auto-logout después de 15 min inactividad
- [ ] Logout limpia sessionStorage y redirige a login
- [ ] Refresh token renueva sesión correctamente

## Dashboard Home
- [ ] KPIs cargan datos correctos del backend
- [ ] Gráfico de distribución renderiza
- [ ] Tabla de pacientes prioritarios muestra 5 pacientes
- [ ] WebSocket actualiza datos en tiempo real (probar enviando evento desde backend)
- [ ] Loading states visibles durante carga

## Lista de Pacientes
- [ ] Tabla muestra todos los pacientes
- [ ] Paginación funciona (10 por página)
- [ ] Filtro por nombre funciona (debounce 300ms)
- [ ] Filtro por riesgo funciona
- [ ] Click en "Ver Detalle" navega correctamente
- [ ] Actualización en tiempo real al cambiar datos de paciente

## Detalle de Paciente
- [ ] Header muestra datos del paciente
- [ ] Métricas vitales con colores correctos
- [ ] Gráfico FEM muestra 7 días y líneas de referencia (80%/50%)
- [ ] Timeline de síntomas ordenado
- [ ] Historial de crisis muestra datos
- [ ] Actualización en tiempo real de nuevo síntoma o FEM
- [ ] FAB abre formulario de intervención

## Alertas
- [ ] Panel muestra alertas del backend
- [ ] WebSocket agrega nuevas alertas en tiempo real
- [ ] Marcar como vista actualiza estado y badge
- [ ] Badge en navbar muestra contador correcto
- [ ] Notificaciones del navegador funcionan (requiere permiso)

## Intervenciones
- [ ] Formulario valida campos obligatorios y fechas futuras
- [ ] Submit crea intervención en backend
- [ ] Dialog de confirmación aparece con opciones
- [ ] Historial se actualiza después de crear

## Reportes
- [ ] Formulario de configuración valida tipo y fechas
- [ ] Reporte individual genera PDF con datos de paciente
- [ ] Reporte semanal incluye resumen y tabla de riesgo
- [ ] PDFs se descargan sin errores y formato legible

## Responsive & UI
- [ ] Dashboard funciona en desktop (>1024px)
- [ ] Dashboard funciona en tablet (768-1024px)
- [ ] Dashboard funciona en mobile (<768px)
- [ ] Sidebar se adapta o colapsa correctamente

## Seguridad
- [ ] Rutas protegidas redirigen a login si no autenticado
- [ ] JWT se envía en headers de todas las requests (Interceptor)
- [ ] Error 401 dispara renovación de token
- [ ] Inputs están sanitizados (Angular por defecto)

## Performance
- [ ] Dashboard carga en < 2 segundos (Initial Load)
- [ ] Gráficos renderizan sin lag
- [ ] Tabla de pacientes no lag con 50+ pacientes
- [ ] WebSocket mantiene conexión (heartbeat 30s)
