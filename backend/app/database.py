import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Cargar variables de entorno desde .env
load_dotenv()

# Obtener URL de la base de datos desde variable de entorno
# Si no existe, usa SQLite por defecto (para desarrollo)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./solensa.db")

# Configuración del engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in SQLALCHEMY_DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()