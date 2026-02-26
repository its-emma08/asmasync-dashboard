# backend/app/api/deps.py
from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from jose import jwt, JWTError

from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from sqlalchemy.future import select

from sqlalchemy.orm import selectinload

security_scheme = HTTPBearer()

async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: HTTPAuthorizationCredentials = Depends(security_scheme)
) -> User:
    try:
        payload = jwt.decode(
            token.credentials, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: falta subject",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_type: str = payload.get("type")
        if token_type != "access":
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: tipo incorrecto",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo validar credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.medical_profile),
            selectinload(User.hospitals)
        )
        .filter(User.id == int(user_id))
    )
    user = result.scalars().first()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    
    return user

def require_role(allowed_roles: list[str]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Permisos insuficientes"
            )
        return current_user
    return role_checker

async def get_current_doctor_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependencia estricta para asegurar que el usuario es un médico o administrador."""
    if current_user.role not in ['admin', 'doctor']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Privilegios insuficientes"
        )
    return current_user
