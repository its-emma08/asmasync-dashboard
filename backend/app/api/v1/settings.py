# backend/app/api/v1/settings.py
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.user import User
from app.models.settings import UserSettingsModel
from app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=dict)
@router.get("/", response_model=dict)
async def get_user_settings(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Obtiene la configuración personalizada del usuario actual.
    """
    stmt = select(UserSettingsModel).filter(UserSettingsModel.user_id == current_user.id)
    res = await db.execute(stmt)
    st = res.scalars().first()

    if not st:
        return {
            "twoFactor": current_user.is_2fa_enabled,
            "pushNotifications": True,
            "emailAlerts": False,
            "smsAlerts": False,
            "alertSound": True,
            "criticalOnly": False,
            "alertFrequency": "realtime",
            "privacyMode": False,
            "autoLock": 15,
            "theme": "light",
            "compactMode": False,
            "accentColor": "#3b82f6"
        }

    return {
        "twoFactor": current_user.is_2fa_enabled or st.two_factor,
        "pushNotifications": st.push_notifications,
        "emailAlerts": st.email_alerts,
        "smsAlerts": st.sms_alerts,
        "alertSound": st.alert_sound,
        "criticalOnly": st.critical_only,
        "alertFrequency": st.alert_frequency,
        "privacyMode": st.privacy_mode,
        "autoLock": st.auto_lock,
        "theme": st.theme,
        "compactMode": st.compact_mode,
        "accentColor": st.accent_color
    }


@router.put("", response_model=dict)
@router.put("/", response_model=dict)
async def update_user_settings(
    request: Request,
    payload: dict,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Actualiza y persiste la configuración del usuario actual en base de datos.
    """
    stmt = select(UserSettingsModel).filter(UserSettingsModel.user_id == current_user.id)
    res = await db.execute(stmt)
    st = res.scalars().first()

    if not st:
        st = UserSettingsModel(user_id=current_user.id)
        db.add(st)

    if "twoFactor" in payload:
        st.two_factor = bool(payload["twoFactor"])
        current_user.is_2fa_enabled = st.two_factor
        db.add(current_user)
    if "pushNotifications" in payload:
        st.push_notifications = bool(payload["pushNotifications"])
    if "emailAlerts" in payload:
        st.email_alerts = bool(payload["emailAlerts"])
    if "smsAlerts" in payload:
        st.sms_alerts = bool(payload["smsAlerts"])
    if "alertSound" in payload:
        st.alert_sound = bool(payload["alertSound"])
    if "criticalOnly" in payload:
        st.critical_only = bool(payload["criticalOnly"])
    if "alertFrequency" in payload:
        st.alert_frequency = str(payload["alertFrequency"])
    if "privacyMode" in payload:
        st.privacy_mode = bool(payload["privacyMode"])
    if "autoLock" in payload:
        st.auto_lock = int(payload["autoLock"])
    if "theme" in payload:
        st.theme = str(payload["theme"])
    if "compactMode" in payload:
        st.compact_mode = bool(payload["compactMode"])
    if "accentColor" in payload:
        st.accent_color = str(payload["accentColor"])

    await AuditService.log_action(
        db,
        action="UPDATE_SETTINGS",
        entity="settings",
        user_id=current_user.id,
        ip_address=request.client.host,
        changes=payload
    )

    await db.commit()
    await db.refresh(st)

    return {
        "status": "success",
        "message": "Configuración guardada exitosamente",
        "settings": {
            "twoFactor": current_user.is_2fa_enabled,
            "pushNotifications": st.push_notifications,
            "emailAlerts": st.email_alerts,
            "smsAlerts": st.sms_alerts,
            "alertSound": st.alert_sound,
            "criticalOnly": st.critical_only,
            "alertFrequency": st.alert_frequency,
            "privacyMode": st.privacy_mode,
            "autoLock": st.auto_lock,
            "theme": st.theme,
            "compactMode": st.compact_mode,
            "accentColor": st.accent_color
        }
    }
