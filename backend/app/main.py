# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, patients, alerts, interventions, dashboard, websocket

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configuración de CORS
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Routers API v1
api_v1_prefix = settings.API_V1_STR

app.include_router(auth.router, prefix=f"{api_v1_prefix}/auth", tags=["Auth"])
app.include_router(patients.router, prefix=f"{api_v1_prefix}/patients", tags=["Patients"])
app.include_router(alerts.router, prefix=f"{api_v1_prefix}/alerts", tags=["Alerts"])
app.include_router(interventions.router, prefix=f"{api_v1_prefix}/interventions", tags=["Interventions"])
app.include_router(dashboard.router, prefix=f"{api_v1_prefix}/dashboard", tags=["Dashboard"])
app.include_router(websocket.router, tags=["WebSockets"]) # WS usually at root or specific path without version prefix sometimes, but here we include it.

@app.get("/")
async def root():
    return {"message": "AsmaSync API is running", "docs": "/docs"}

@app.on_event("startup")
async def startup_event():
    # Aquí podríamos inicializar conexiones globales si fuera necesario
    # aunque SQLAlchemy y Redis lo manejan perezosamente o por request.
    pass
