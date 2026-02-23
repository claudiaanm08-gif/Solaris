from fastapi import FastAPI
from app.database import engine, Base
from app import models
import os

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def read_root():
    return {
        "message": "Solensa API",
        "environment": os.getenv("ENVIRONMENT", "development")
    }