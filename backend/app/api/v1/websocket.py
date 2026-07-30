# backend/app/api/v1/websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from typing import Dict, List, Any
import json
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import security
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from sqlalchemy.future import select

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # user_id -> [websocket_connections]
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                await connection.send_json(message)
    
    async def broadcast(self, message: dict):
        for user_connections in self.active_connections.values():
            for connection in user_connections:
                await connection.send_json(message)
                
    async def broadcast_to_role(self, message: dict, role: str, db: AsyncSession):
        """
        Envía mensaje a usuarios de un rol específico.
        Requiere consultar BD para obtener IDs de usuarios con ese rol.
        """
        # En implementación real, cachear esto en Redis para evitar query en loop
        result = await db.execute(select(User.id).filter(User.role == role))
        user_ids = result.scalars().all()
        
        for user_id in user_ids:
            if user_id in self.active_connections:
                await self.send_personal_message(message, user_id)

manager = ConnectionManager()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    user_id = None
    try:
        # Validar Token
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str: str = payload.get("sub")
        
        if not user_id_str:
            await websocket.close(code=1008, reason="Token inválido")
            return
            
        user_id = int(user_id_str)
        
        # Validar Usuario en BD
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalars().first()
        
        if not user or not user.is_active:
             await websocket.close(code=1008, reason="Usuario no autorizado")
             return

        await manager.connect(websocket, user_id)
        
        # Bienvenida
        await websocket.send_json({
            "type": "connection_established",
            "message": f"Conectado como {user.full_name}",
            "user_id": user_id
        })
        
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            
    except JWTError:
        await websocket.close(code=1008, reason="Token inválido o expirado")
    except WebSocketDisconnect:
        if user_id:
            manager.disconnect(websocket, user_id)
    except Exception as e:
        # print(f"Error en WebSocket: {e}")
        await websocket.close(code=1011, reason="Error interno")
