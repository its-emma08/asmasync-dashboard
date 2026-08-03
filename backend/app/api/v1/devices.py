# backend/app/api/v1/devices.py
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.api import deps
from app.models.user import User
from app.models.device import IoTDeviceModel
from app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=List[dict])
@router.get("/", response_model=List[dict])
async def list_devices(
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Lista todos los dispositivos IoT (Espirómetros, Relojes Inteligentes, Sensores) asociados.
    """
    stmt = select(IoTDeviceModel).filter(IoTDeviceModel.user_id == current_user.id)
    res = await db.execute(stmt)
    devices = res.scalars().all()

    if not devices:
        # Retornar lista por defecto orientada a salud respiratoria
        return [
            {
                "id": "dev-1",
                "device_type": "spirometer_bluetooth",
                "device_brand": "AsmaSync Pro",
                "device_model": "Smart Spirometer V2",
                "is_active": True,
                "battery_level": 88,
                "created_at": "2026-02-01T10:00:00Z"
            },
            {
                "id": "dev-2",
                "device_type": "oximeter_sensor",
                "device_brand": "Nonin",
                "device_model": "PulseOxi 3200",
                "is_active": True,
                "battery_level": 94,
                "created_at": "2026-02-05T14:30:00Z"
            }
        ]

    return [
        {
            "id": d.id,
            "device_type": d.device_type,
            "device_brand": d.device_brand,
            "device_model": d.device_model,
            "serial_number": d.serial_number,
            "is_active": d.is_active,
            "battery_level": d.battery_level,
            "last_sync": d.last_sync.isoformat() if d.last_sync else None,
            "created_at": d.created_at.isoformat() if d.created_at else None
        }
        for d in devices
    ]


@router.post("", response_model=dict)
@router.post("/", response_model=dict)
async def register_device(
    request: Request,
    payload: dict,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Vincular o registrar un nuevo dispositivo médico/IoT.
    """
    device_type = payload.get("device_type", "spirometer")
    device_brand = payload.get("device_brand", "AsmaSync")
    device_model = payload.get("device_model", "Model X")
    serial_number = payload.get("serial_number")

    device = IoTDeviceModel(
        user_id=current_user.id,
        patient_id=payload.get("patient_id"),
        device_type=device_type,
        device_brand=device_brand,
        device_model=device_model,
        serial_number=serial_number,
        is_active=True,
        battery_level=100
    )
    db.add(device)

    await AuditService.log_action(
        db,
        action="REGISTER_DEVICE",
        entity="device",
        user_id=current_user.id,
        ip_address=request.client.host,
        changes=payload
    )

    await db.commit()
    await db.refresh(device)

    return {
        "status": "success",
        "message": "Dispositivo vinculado exitosamente",
        "id": device.id
    }


@router.delete("/{device_id}", response_model=dict)
async def unlink_device(
    device_id: int,
    request: Request,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
) -> Any:
    """
    Desvincular o remover un dispositivo.
    """
    stmt = select(IoTDeviceModel).filter(IoTDeviceModel.id == device_id, IoTDeviceModel.user_id == current_user.id)
    res = await db.execute(stmt)
    device = res.scalars().first()

    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")

    await db.delete(device)

    await AuditService.log_action(
        db,
        action="UNLINK_DEVICE",
        entity="device",
        entity_id=device_id,
        user_id=current_user.id,
        ip_address=request.client.host
    )

    await db.commit()

    return {"status": "success", "message": "Dispositivo desvinculado"}
