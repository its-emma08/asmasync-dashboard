# backend/app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    id: Optional[int] = None
    role: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: Optional[int] = None
    user: Optional[dict] = None
    require_2fa: bool = False
    temp_token: Optional[str] = None

class Disable2FARequest(BaseModel):
    password: str

class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code: str

class TwoFactorVerifyRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=2)
    secret_key: str

class Login2FARequest(BaseModel):
    temp_token: str
    code: str = Field(..., min_length=2, max_length=2)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyResetCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
