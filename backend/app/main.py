# backend/app/main.py
from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, patients, alerts, interventions, dashboard, websocket, hospitals, clinical_records, consents, reports, measurements, environment, users, security

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION
)

# SEC-002: CORS origins now loaded from settings (env file) — not hardcoded
origins = settings.CORS_ORIGINS or [
    "http://localhost:4200",
    "http://localhost:3000",
    "http://127.0.0.1:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(o) for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Routers API v1
api_v1_prefix = settings.API_V1_STR

app.include_router(auth.router, prefix=f"{api_v1_prefix}/auth", tags=["Auth"])
app.include_router(users.router, prefix=f"{api_v1_prefix}/users", tags=["Users"])
app.include_router(patients.router, prefix=f"{api_v1_prefix}/patients", tags=["Patients"])
app.include_router(alerts.router, prefix=f"{api_v1_prefix}/alerts", tags=["Alerts"])
app.include_router(interventions.router, prefix=f"{api_v1_prefix}/interventions", tags=["Interventions"])
app.include_router(dashboard.router, prefix=f"{api_v1_prefix}/dashboard", tags=["Dashboard"])
app.include_router(security.router, prefix=f"{api_v1_prefix}/security", tags=["Security"])
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

app.include_router(
    environment.router,
    prefix=f"{api_v1_prefix}/environment",
    tags=["Environment & Weather"]
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Error de validación en los datos enviados.",
            "code": "VALIDATION_ERROR",
            "errors": exc.errors()
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "code": f"HTTP_{exc.status_code}_ERROR"
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Error interno del servidor. Por favor contacte soporte.",
            "code": "INTERNAL_SERVER_ERROR"
        },
    )

@app.get("/")
async def root():
    return {"message": "AsmaSync API is running", "docs": "/docs"}

@app.on_event("startup")
async def startup_event():
    # Aquí podríamos inicializar conexiones globales si fuera necesario
    # aunque SQLAlchemy y Redis lo manejan perezosamente o por request.
    pass
