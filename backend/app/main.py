# backend/app/main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, patients, alerts, interventions, dashboard, websocket, hospitals, clinical_records, consents, reports, measurements

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION
)

# Configuración de CORS
origins = [
    "http://localhost:4200",
    "http://localhost:3000",
    "http://127.0.0.1:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
app.include_router(websocket.router, tags=["WebSockets"])

# Advanced Backend Phase 1
app.include_router(
    hospitals.router,
    prefix=f"{api_v1_prefix}",
    tags=["Hospitals & Organizations"]
)

app.include_router(
    clinical_records.router,
    prefix=f"{api_v1_prefix}",
    tags=["Clinical Records"]
)

app.include_router(
    consents.router,
    prefix=f"{api_v1_prefix}/consents",
    tags=["Legal & Consents"]
)

app.include_router(
    reports.router,
    prefix=f"{api_v1_prefix}/reports",
    tags=["Reports & Exports"]
)

app.include_router(
    measurements.router,
    prefix=f"{api_v1_prefix}/measurements",
    tags=["Measurements & Vitals"]
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # En producción bloquear detalles. Aquí permitimos log en consola pero al cliente solo error genérico.
    print(f"Global Error: {exc}") # Log interno
    return JSONResponse(
        status_code=500,
        content={"message": "Error interno del servidor. Por favor contacte soporte."},
    )

@app.get("/")
async def root():
    return {"message": "AsmaSync API is running", "docs": "/docs"}

@app.on_event("startup")
async def startup_event():
    # Aquí podríamos inicializar conexiones globales si fuera necesario
    # aunque SQLAlchemy y Redis lo manejan perezosamente o por request.
    pass
