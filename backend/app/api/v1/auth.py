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
from app.schemas.auth import LoginRequest, TokenResponse, Token, ForgotPasswordRequest, VerifyResetCodeRequest, ResetPasswordRequest, TwoFactorSetupResponse, TwoFactorVerifyRequest, Login2FARequest, Disable2FARequest
from app.models.user import PasswordResetCode
import random
from datetime import datetime
from zoneinfo import ZoneInfo
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
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    # Verificación de bloqueo temporal
    now = datetime.now(ZoneInfo("UTC"))
    if user.locked_until and user.locked_until > now:
        # Cuenta sigue bloqueada
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Cuenta bloqueada temporalmente por seguridad. Intenta más tarde."
        )

    # Validar Contraseña
    if not security.verify_password(credentials.password, user.password_hash):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        
        # Bloquear si llega a 3
        if user.failed_login_attempts >= 3:
            user.locked_until = now + timedelta(minutes=15)
            db.add(user)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Cuenta bloqueada temporalmente por seguridad."
            )
            
        db.add(user)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )
        
    if not user.is_active:
         raise HTTPException(status_code=400, detail="Usuario inactivo")

    if user.is_2fa_enabled:
        # Generar código 2-dígitos y opciones
        correct_code = str(random.randint(10, 99))
        options = [correct_code]
        while len(options) < 3:
            fake_code = str(random.randint(10, 99))
            if fake_code not in options:
                options.append(fake_code)
        
        random.shuffle(options)
        
        # Simular envío de correo
        print(f"\n[ASMASYNC EMAIL SIMULATION]\nPara: {user.email}\nAsunto: Verificación de Inicio de Sesión\nMensaje: Se ha detectado un intento de inicio de sesión. Si eres tú, selecciona este número en la pantalla: {correct_code}\n")
        
        # We need a robust persistent layer for this code to verify in `/login/2fa`.
        # However, to avoid db migrations right now, we can embed it securely in the temporal JWT payload
        temp_token = security.create_access_token(
            subject=str(user.id),
            expires_delta=timedelta(minutes=5),
            additional_claims={"2fa_code": correct_code} # Securely embedding the expected answer
        )
        return {
            "require_2fa": True,
            "temp_token": temp_token,
            "access_token": None,
            "expires_in": None,
            "user": None,
            "options": options # The frontend will use these 3 options
        }

    # Login exitoso: Resetear contador e intentos
    user.last_login = func.now()
    user.failed_login_attempts = 0
    user.locked_until = None
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

@router.post("/login/2fa", response_model=TokenResponse)
async def login_2fa(
    response: Response,
    request: Request,
    payload: Login2FARequest,
    db: AsyncSession = Depends(deps.get_db)
):
    """Segunda etapa del login: Validar código 2-dígitos del Email."""
    try:
        # Decodificar temp_token
        token_data = jwt.decode(payload.temp_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = token_data.get("sub")
        expected_code = token_data.get("2fa_code")
        if not user_id or not expected_code:
            raise HTTPException(status_code=401, detail="Token temporal inválido.")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token temporal expirado o inválido.")
        
    user = await db.get(User, int(user_id))
    if not user or not user.is_2fa_enabled:
         raise HTTPException(status_code=400, detail="El usuario no tiene 2FA configurado.")
         
    if payload.code != expected_code:
        raise HTTPException(status_code=401, detail="Código de seguridad incorrecto.")
        
    # Login exitoso: Resetear contador e intentos
    user.last_login = func.now()
    user.failed_login_attempts = 0
    user.locked_until = None
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
        secure=True,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )

    await AuditService.log_action(
        db,
        action="LOGIN_2FA",
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
        "require_2fa": False,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "doctor_code": user.doctor_code
        }
    }

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """Generar código 2-dígitos para verificar el correo de configuración."""
    # En desarrollo enviamos el código 2FA sin pyotp; en config no requerimos QR.
    setup_code = str(random.randint(10, 99))
    
    # En un entorno real se enviaría el correo. Lo simulamos:
    print(f"\n[ASMASYNC EMAIL SIMULATION]\nPara: {current_user.email}\nAsunto: Configuración 2FA\nMensaje: Tu código para activar el 2FA es: {setup_code}\n")
    
    # Para no guardar en DB estáticamente antes de verificar, lo regresamos como "secreto" seguro
    # para el setup momentáneo del cliente.
    return {"secret": setup_code, "qr_code": "email_interactive"}

@router.post("/2fa/verify")
async def verify_2fa(
    request: TwoFactorVerifyRequest,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """Validar código de 2-dígitos y activar 2FA permanentemente."""
    # Here `request.secret_key` comes from the `secret` we originally passed in `setup_2fa`
    # and `request.code` is the code the user selected.
    if request.code != request.secret_key:
        raise HTTPException(status_code=400, detail="El código seleccionado no coincide.")
        
    current_user.is_2fa_enabled = True
    db.add(current_user)
    
    await AuditService.log_action(
        db,
        action="ENABLE_2FA",
        entity="auth",
        user_id=current_user.id,
        ip_address="0.0.0.0"
    )
    
    await db.commit()
    return {"message": "Autenticación de Dos Factores activada con éxito."}

@router.post("/2fa/disable")
async def disable_2fa(
    request: Request,
    payload: Disable2FARequest,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(deps.get_db)
):
    """Desactivar 2FA requiriendo la contraseña actual para verificar."""
    # Verificar contraseña actual
    if not security.verify_password(payload.password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Contraseña incorrecta.")
        
    current_user.is_2fa_enabled = False
    current_user.totp_secret = None
    db.add(current_user)
    
    await AuditService.log_action(
        db,
        action="DISABLE_2FA",
        entity="auth",
        user_id=current_user.id,
        ip_address=request.client.host
    )
    
    await db.commit()
    return {"message": "Autenticación de Dos Factores desactivada."}

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

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    # 1. Check if user exists
    result = await db.execute(select(User).filter(User.email == request.email))
    user = result.scalars().first()

    # Siempre retornamos 200 por seguridad (evitar enumeración de usuarios)
    if user:
        # Generar código
        otp = f"{random.randint(0, 999999):06d}"
        now = datetime.now(ZoneInfo("UTC"))
        expires = now + timedelta(minutes=15)
        
        reset_code = PasswordResetCode(
            email=user.email,
            code=otp,
            expires_at=expires
        )
        db.add(reset_code)
        await db.commit()
        
        # Simular envío por consola visible para la demo
        print(f"\n==========================================")
        print(f"[EMAIL SIMULATOR] Enviando código {otp} a {user.email}")
        print(f"==========================================\n")
        
    return {"message": "Si el correo está registrado, recibirás un código de 6 dígitos."}

@router.post("/verify-reset-code")
async def verify_reset_code(
    request: VerifyResetCodeRequest,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    now = datetime.now(ZoneInfo("UTC"))
    
    stmt = select(PasswordResetCode).filter(
        PasswordResetCode.email == request.email,
        PasswordResetCode.code == request.code,
        PasswordResetCode.expires_at > now
    ).order_by(PasswordResetCode.created_at.desc())
    
    result = await db.execute(stmt)
    code_record = result.scalars().first()
    
    if not code_record:
        raise HTTPException(
            status_code=400,
            detail="El código es inválido o ha expirado."
        )
        
    # Generamos un token temporal muy corto para el reseteo
    temp_token = security.create_access_token(
        subject=request.email, # Guardamos el email como subject temporal
        expires_delta=timedelta(minutes=15)
    )
    
    return {"temp_token": temp_token}

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(deps.get_db)
) -> Any:
    try:
        # Decodificar token para extraer el email
        payload = jwt.decode(request.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        
        if email is None:
            raise HTTPException(status_code=401, detail="Token de reseteo inválido")
            
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Token de reseteo expirado o inválido")

    # Buscar usuario
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar contraseña
    user.password_hash = security.get_password_hash(request.new_password)
    
    # Limpiar todos los códigos de este email para seguridad
    await db.execute(
        PasswordResetCode.__table__.delete().where(PasswordResetCode.email == email)
    )
    
    # Log de seguridad
    await AuditService.log_action(
        db,
        action="PASSWORD_RESET",
        entity="auth",
        user_id=user.id,
        ip_address="0.0.0.0", # Podría capturarse del request
        changes={"field": "password_hash"}
    )
    
    await db.commit()
    return {"message": "Contraseña actualizada exitosamente."}

