import asyncio
import sys
import os

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

async def create_initial_users():
    """Crea usuarios iniciales para el sistema (Async)"""
    async with SessionLocal() as db:
        try:
            # ========================================
            # USUARIO 1: SUPER ADMIN
            # ========================================
            admin_email = "admin@asmasync.com"
            result = await db.execute(select(User).filter(User.email == admin_email))
            existing_admin = result.scalars().first()
            
            if not existing_admin:
                admin = User(
                    email=admin_email,
                    password_hash=get_password_hash("Admin123!"),
                    full_name="Administrador del Sistema",
                    role="admin",
                    is_active=True,
                    last_login=None
                )
                db.add(admin)
                print(f"✅ Usuario ADMIN preparado: {admin_email}")
            else:
                print(f"ℹ️  Usuario admin ya existe")
            
            # ========================================
            # USUARIO 2: ENFERMERA DE PRUEBA
            # ========================================
            nurse_email = "enfermera@asmasync.com"
            result = await db.execute(select(User).filter(User.email == nurse_email))
            existing_nurse = result.scalars().first()
            
            if not existing_nurse:
                nurse = User(
                    email=nurse_email,
                    password_hash=get_password_hash("Nurse123!"),
                    full_name="María González López",
                    role="nurse",
                    is_active=True,
                    last_login=None
                )
                db.add(nurse)
                print(f"✅ Usuario ENFERMERA preparado: {nurse_email}")
            else:
                print(f"ℹ️  Usuario enfermera ya existe")
            
            # ========================================
            # USUARIO 3: MÉDICO DE PRUEBA
            # ========================================
            doctor_email = "doctor@asmasync.com"
            result = await db.execute(select(User).filter(User.email == doctor_email))
            existing_doctor = result.scalars().first()
            
            if not existing_doctor:
                doctor = User(
                    email=doctor_email,
                    password_hash=get_password_hash("Doctor123!"),
                    full_name="Dr. Juan Pérez Martínez",
                    role="doctor",
                    is_active=True,
                    last_login=None
                )
                db.add(doctor)
                print(f"✅ Usuario MÉDICO preparado: {doctor_email}")
            else:
                print(f"ℹ️  Usuario médico ya existe")
            
            # Guardar cambios
            await db.commit()
            
            print("\n" + "="*60)
            print("✅ USUARIOS INICIALES CREADOS EXITOSAMENTE")
            print("="*60)
            
        except Exception as e:
            print(f"\n❌ Error al crear usuarios: {str(e)}")
            await db.rollback()
            raise

if __name__ == "__main__":
    try:
        # Fix for Windows loop policy if needed, though standard usually works
        if sys.platform == 'win32':
             asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        asyncio.run(create_initial_users())
    except Exception as e:
        print(f"Critical Error: {e}")