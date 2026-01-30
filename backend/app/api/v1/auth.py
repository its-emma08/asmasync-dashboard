# backend/app/api/v1/auth.py
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.schemas.auth import LoginRequest, TokenResponse, Token
from app.services.audit_service import AuditService

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    credentials: LoginRequest,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """
    Login de usuario. Retorna Access Token + Refresh Token.
    """
    result = await db.execute(select(User).filter(User.email == credentials.email))
    user = result.scalars().first()

    if not user or not security.verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
        
    if not user.is_active:
         raise HTTPException(status_code=400, detail="Usuario inactivo")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(user.id)
    
    # Auditoría
    await AuditService.log_action(
        db,
        action="LOGIN",
        entity="auth",
        user_id=user.id,
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent")
    )
    await db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: Request,
    token_in: str, # Recibir en body o query. Idealmente body. Simplificado aquí.
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """
    Renueva el access token usando un refresh token válido.
    """
    # ... Logica de validación de refresh token ...
    # Simplificado: Asumiendo que el cliente envía el refresh token y lo validamos igual que el access token
    # En producción, se recomienda una tabla de refresh tokens revocados o whitelist en Redis.
    pass
