from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.core import security
from app.models.user import User
from app.schemas.user import User as UserSchema, UserUpdate, UserPasswordUpdate
from app.services.audit_service import AuditService

router = APIRouter()

@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Obtiene el usuario actual (útil para recargar estado como 2FA).
    """
    return current_user

@router.put("/me", response_model=UserSchema)
async def update_user_me(
    request: Request,
    user_in: UserUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_doctor_user)
) -> Any:
    """
    Actualiza el perfil del usuario autenticado de forma segura.
    No permite modificar la clave desde aquí, ni rol (a menos que se quiera extender).
    """
    update_data = user_in.model_dump(exclude_unset=True)
    
    # Prevenir actualización indirecta de campos restringidos
    if "password" in update_data:
        del update_data["password"]
    if "role" in update_data:
        del update_data["role"]
        
    for field, value in update_data.items():
        setattr(current_user, field, value)
        
    db.add(current_user)
    
    # Audit log
    await AuditService.log_action(
        db,
        action="UPDATE_PROFILE",
        entity="user",
        user_id=current_user.id,
        ip_address=request.client.host,
        changes=update_data
    )
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user

@router.put("/me/password", response_model=dict)
async def update_password_me(
    request: Request,
    password_data: UserPasswordUpdate,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_doctor_user)
) -> Any:
    """
    Actualiza la contraseña del usuario actualmente autenticado.
    Verifica primero la contraseña actual.
    """
    if not security.verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta."
        )

    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña no puede ser idéntica a la anterior."
        )

    current_user.password_hash = security.get_password_hash(password_data.new_password)
    db.add(current_user)
    
    await AuditService.log_action(
        db,
        action="UPDATE_PASSWORD",
        entity="auth",
        user_id=current_user.id,
        ip_address=request.client.host,
        changes={"field": "password_hash"}
    )
    
    await db.commit()
    
    return {"message": "Contraseña actualizada exitosamente."}
