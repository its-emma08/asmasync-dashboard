# backend/app/api/v1/auth.py
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from jose import jwt
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.future import select
from sqlalchemy.sql import func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User, UserProfile
from app.schemas.user import UserCreate, User as UserSchema
from app.schemas.auth import LoginRequest, TokenResponse, Token
from app.services.audit_service import AuditService

router = APIRouter()

@router.post("/register", response_model=UserSchema)
async def register(
    request: Request,
    user_in: UserCreate,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """
    Registra un nuevo usuario y su perfil asociado.
    """
    # 1. Verificar si el email ya existe
    result = await db.execute(select(User).filter(User.email == user_in.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="El email ya está registrado en el sistema."
        )

    # 2. Crear Usuario
    user = User(
        email=user_in.email,
        password_hash=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        doctor_code=user_in.doctor_code
    )
    db.add(user)
    await db.flush() # Para obtener user.id

    # 3. Crear Perfil (Mapeo 1-to-1)
    if user.role == "patient":
        profile = UserProfile(user_id=user.id)
        db.add(profile)
    
    # 4. Auditoría
    await AuditService.log_action(
        db,
        action="REGISTER",
        entity="user",
        user_id=user.id,
        ip_address=request.client.host,
        changes={"role": user.role}
    )

    await db.commit()
    # Reload with profile to avoid Pydantic async lazy load issues
    stmt = select(User).options(selectinload(User.profile)).where(User.id == user.id)
    result = await db.execute(stmt)
    user = result.scalar_one()
    return user

@router.post("/login", response_model=TokenResponse)
async def login(
    response: Response,
    request: Request,
    credentials: LoginRequest,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """
    Login de usuario. Retorna Access Token + Refresh Token (HttpOnly Cookie).
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

    # Update Last Login
    user.last_login = func.now()
    db.add(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(user.id)
    
    # Secure Cookie for Refresh Token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True, # Requires HTTPS (locally might need false if plain http, but standard is true)
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )

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
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "doctor_code": user.doctor_code
        }
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    """
    Renueva el access token usando validando el Refresh Token (desde Cookie).
    """
    refresh_token_cookie = request.cookies.get("refresh_token")
    if not refresh_token_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token no encontrado",
        )
    
    # Validar JWT signature
    try:
        payload = jwt.decode(refresh_token_cookie, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_type = payload.get("type")
        if token_type != "refresh":
            raise HTTPException(status_code=401, detail="Token inválido")
        user_id = payload.get("sub")
        if user_id is None:
             raise HTTPException(status_code=401, detail="Token inválido")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")

    # Verificar usuario db
    user = await db.get(User, int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    # Rotación de Refresh Token (Seguridad Extra)
    new_access_token = security.create_access_token(user.id)
    new_refresh_token = security.create_refresh_token(user.id)
    
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )

    return {
        "access_token": new_access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(response: Response):
    """
    Cierra sesión eliminando la cookie HttpOnly de refresh token.
    El cliente también debe eliminar el access token de su almacenamiento local.
    """
    response.delete_cookie(
        key="refresh_token", 
        httponly=True, 
        secure=True, 
        samesite="lax"
    )
    return {"message": "Sesión cerrada exitosamente"}
