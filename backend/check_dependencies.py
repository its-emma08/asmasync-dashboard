try:
    import alembic
    import sqlalchemy
    import fastapi
    print("SUCCESS: Modules found.")
    print(f"Alembic version: {alembic.__version__}")
    print(f"SQLAlchemy version: {sqlalchemy.__version__}")
except ImportError as e:
    print(f"ERROR: Missing module {e}")
