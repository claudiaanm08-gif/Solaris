from fastapi import FastAPI, Depends, HTTPException, APIRouter, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app import crud, models, schemas
from app.database import SessionLocal, engine

import os
import shutil
import csv
import io
from fastapi import File, UploadFile
from datetime import date
from typing import Optional

from fastapi.responses import FileResponse


# Crear tablas si no existen
models.Base.metadata.create_all(bind=engine)

app = FastAPI()
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencia para obtener sesión de BD
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Rutas para Clientes
@app.post("/clientes/", response_model=schemas.Cliente)
def create_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    return crud.create_cliente(db=db, cliente=cliente)

@api_router.post("/clientes/", response_model=schemas.Cliente)
def api_create_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(get_db)):
    return crud.create_cliente(db=db, cliente=cliente)

@app.get("/clientes/", response_model=list[schemas.Cliente])
def read_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    clientes = crud.get_clientes(db, skip=skip, limit=limit)
    return clientes

@api_router.get("/clientes", response_model=list[schemas.Cliente])
@api_router.get("/clientes/", response_model=list[schemas.Cliente])
def api_read_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    clientes = crud.get_clientes(db, skip=skip, limit=limit)
    return clientes

@app.get("/clientes/{cliente_id}", response_model=schemas.Cliente)
def read_cliente(cliente_id: int, db: Session = Depends(get_db)):
    db_cliente = crud.get_cliente(db, cliente_id=cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_cliente

@api_router.get("/clientes/{cliente_id}", response_model=schemas.Cliente)
def api_read_cliente(cliente_id: int, db: Session = Depends(get_db)):
    db_cliente = crud.get_cliente(db, cliente_id=cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_cliente

@app.put("/clientes/{cliente_id}", response_model=schemas.Cliente)
def update_cliente(cliente_id: int, cliente: schemas.ClienteUpdate, db: Session = Depends(get_db)):
    db_cliente = crud.update_cliente(db, cliente_id=cliente_id, cliente=cliente)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_cliente

@api_router.put("/clientes/{cliente_id}", response_model=schemas.Cliente)
def api_update_cliente(cliente_id: int, cliente: schemas.ClienteUpdate, db: Session = Depends(get_db)):
    db_cliente = crud.update_cliente(db, cliente_id=cliente_id, cliente=cliente)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return db_cliente

@app.delete("/clientes/{cliente_id}")
def delete_cliente(cliente_id: int, db: Session = Depends(get_db)):
    db_cliente = crud.delete_cliente(db, cliente_id=cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"message": "Cliente eliminado correctamente"}

@api_router.delete("/clientes/{cliente_id}")
def api_delete_cliente(cliente_id: int, db: Session = Depends(get_db)):
    db_cliente = crud.delete_cliente(db, cliente_id=cliente_id)
    if db_cliente is None:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"message": "Cliente eliminado correctamente"}


# endpoints para Contratos
UPLOAD_DIR = "uploads/contratos"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _crear_contrato_con_pdf(
    cliente_id: int,
    volumen_contratado: float,
    fecha_inicio: date,
    fecha_fin: date,
    condiciones: Optional[str],
    archivo: UploadFile,
    db: Session,
):
    cliente = crud.get_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if not archivo.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")

    file_location = os.path.join(UPLOAD_DIR, f"{cliente_id}_{archivo.filename}")
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)

    db_contrato = models.Contrato(
        cliente_id=cliente_id,
        volumen_contratado=volumen_contratado,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        condiciones=condiciones,
        archivo_pdf=file_location,
        nombre_archivo=archivo.filename,
    )
    db.add(db_contrato)
    db.commit()
    db.refresh(db_contrato)
    return db_contrato


@app.post("/contratos/", response_model=schemas.Contrato)
async def create_contrato(
    cliente_id: int = Form(...),
    volumen_contratado: float = Form(...),
    fecha_inicio: date = Form(...),
    fecha_fin: date = Form(...),
    condiciones: Optional[str] = Form(None),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    return _crear_contrato_con_pdf(
        cliente_id=cliente_id,
        volumen_contratado=volumen_contratado,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        condiciones=condiciones,
        archivo=archivo,
        db=db,
    )


@api_router.post("/contratos/", response_model=schemas.Contrato)
async def api_create_contrato(
    cliente_id: int = Form(...),
    volumen_contratado: float = Form(...),
    fecha_inicio: date = Form(...),
    fecha_fin: date = Form(...),
    condiciones: Optional[str] = Form(None),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    return _crear_contrato_con_pdf(
        cliente_id=cliente_id,
        volumen_contratado=volumen_contratado,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        condiciones=condiciones,
        archivo=archivo,
        db=db,
    )

@app.get("/clientes/{cliente_id}/contratos/", response_model=list[schemas.Contrato])
def read_contratos(cliente_id: int, db: Session = Depends(get_db)):
    contratos = crud.get_contratos_by_cliente(db, cliente_id)
    return contratos

@api_router.get("/clientes/{cliente_id}/contratos/", response_model=list[schemas.Contrato])
def api_read_contratos(cliente_id: int, db: Session = Depends(get_db)):
    contratos = crud.get_contratos_by_cliente(db, cliente_id)
    return contratos

@app.get("/contratos/{contrato_id}/pdf")
def get_contrato_pdf(contrato_id: int, db: Session = Depends(get_db)):
    contrato = db.query(models.Contrato).filter(models.Contrato.id == contrato_id).first()
    if not contrato or not contrato.archivo_pdf:
        raise HTTPException(status_code=404, detail="PDF no encontrado")
    return FileResponse(contrato.archivo_pdf, media_type='application/pdf')

@api_router.get("/contratos/{contrato_id}/pdf")
def api_get_contrato_pdf(contrato_id: int, db: Session = Depends(get_db)):
    contrato = db.query(models.Contrato).filter(models.Contrato.id == contrato_id).first()
    if not contrato or not contrato.archivo_pdf:
        raise HTTPException(status_code=404, detail="PDF no encontrado")
    return FileResponse(contrato.archivo_pdf, media_type='application/pdf')


# endpoints para Entregas
@app.post("/entregas/", response_model=schemas.Entrega)
def create_entrega(entrega: schemas.EntregaCreate, db: Session = Depends(get_db)):
    contrato = db.query(models.Contrato).filter(models.Contrato.id == entrega.contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    return crud.create_entrega(db=db, entrega=entrega)


@api_router.post("/entregas/", response_model=schemas.Entrega)
def api_create_entrega(entrega: schemas.EntregaCreate, db: Session = Depends(get_db)):
    contrato = db.query(models.Contrato).filter(models.Contrato.id == entrega.contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    return crud.create_entrega(db=db, entrega=entrega)


@app.get("/clientes/{cliente_id}/entregas/", response_model=list[schemas.Entrega])
def read_entregas_cliente(cliente_id: int, db: Session = Depends(get_db)):
    return crud.get_entregas_by_cliente(db, cliente_id)


@api_router.get("/clientes/{cliente_id}/entregas/", response_model=list[schemas.Entrega])
def api_read_entregas_cliente(cliente_id: int, db: Session = Depends(get_db)):
    return crud.get_entregas_by_cliente(db, cliente_id)


@app.get("/contratos/{contrato_id}/entregas/", response_model=list[schemas.Entrega])
def read_entregas_contrato(contrato_id: int, db: Session = Depends(get_db)):
    return crud.get_entregas_by_contrato(db, contrato_id)


@api_router.get("/contratos/{contrato_id}/entregas/", response_model=list[schemas.Entrega])
def api_read_entregas_contrato(contrato_id: int, db: Session = Depends(get_db)):
    return crud.get_entregas_by_contrato(db, contrato_id)


# endpoints para Consumos
@app.post("/consumos/", response_model=schemas.Consumo)
def create_consumo(consumo: schemas.ConsumoCreate, db: Session = Depends(get_db)):
    contrato = db.query(models.Contrato).filter(models.Contrato.id == consumo.contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    return crud.create_consumo(db=db, consumo=consumo)


@api_router.post("/consumos/", response_model=schemas.Consumo)
def api_create_consumo(consumo: schemas.ConsumoCreate, db: Session = Depends(get_db)):
    contrato = db.query(models.Contrato).filter(models.Contrato.id == consumo.contrato_id).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    return crud.create_consumo(db=db, consumo=consumo)


@app.get("/clientes/{cliente_id}/consumos/", response_model=list[schemas.Consumo])
def read_consumos_cliente(cliente_id: int, db: Session = Depends(get_db)):
    return crud.get_consumos_by_cliente(db, cliente_id)


@api_router.get("/clientes/{cliente_id}/consumos/", response_model=list[schemas.Consumo])
def api_read_consumos_cliente(cliente_id: int, db: Session = Depends(get_db)):
    return crud.get_consumos_by_cliente(db, cliente_id)


@app.get("/contratos/{contrato_id}/consumos/", response_model=list[schemas.Consumo])
def read_consumos_contrato(contrato_id: int, db: Session = Depends(get_db)):
    return crud.get_consumos_by_contrato(db, contrato_id)


@api_router.get("/contratos/{contrato_id}/consumos/", response_model=list[schemas.Consumo])
def api_read_consumos_contrato(contrato_id: int, db: Session = Depends(get_db)):
    return crud.get_consumos_by_contrato(db, contrato_id)


# endpoints para Variaciones
@app.get("/clientes/{cliente_id}/variaciones/", response_model=list[schemas.VariacionContrato])
def read_variaciones_cliente(cliente_id: int, db: Session = Depends(get_db)):
    return crud.get_variaciones_by_cliente(db, cliente_id)


@api_router.get("/clientes/{cliente_id}/variaciones/", response_model=list[schemas.VariacionContrato])
def api_read_variaciones_cliente(cliente_id: int, db: Session = Depends(get_db)):
    return crud.get_variaciones_by_cliente(db, cliente_id)


@app.get("/contratos/{contrato_id}/variacion/", response_model=schemas.VariacionContrato)
def read_variacion_contrato(contrato_id: int, db: Session = Depends(get_db)):
    variacion = crud.get_variacion_by_contrato(db, contrato_id)
    if not variacion:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    return variacion


@api_router.get("/contratos/{contrato_id}/variacion/", response_model=schemas.VariacionContrato)
def api_read_variacion_contrato(contrato_id: int, db: Session = Depends(get_db)):
    variacion = crud.get_variacion_by_contrato(db, contrato_id)
    if not variacion:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
    return variacion


@api_router.get("/cotizaciones", response_model=list[schemas.Cotizacion])
def api_read_cotizaciones(limit: int = 50):
    return []


# endpoints para Dashboard
@app.get("/dashboard/kpis", response_model=list[schemas.DashboardKPI])
def read_dashboard_kpis(
    cliente_id: Optional[int] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return crud.get_dashboard_kpis(db, cliente_id=cliente_id, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)


@api_router.get("/dashboard/kpis", response_model=list[schemas.DashboardKPI])
def api_read_dashboard_kpis(
    cliente_id: Optional[int] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return crud.get_dashboard_kpis(db, cliente_id=cliente_id, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)


@app.get("/dashboard/kpis/export")
def export_dashboard_kpis(
    cliente_id: Optional[int] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    kpis = crud.get_dashboard_kpis(db, cliente_id=cliente_id, fecha_inicio=fecha_inicio, fecha_fin=fecha_fin)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "cliente_id",
        "cliente_nombre",
        "volumen_contratado",
        "volumen_entregado",
        "volumen_consumido",
        "almacenamiento_estimado",
        "margen_estimado",
    ])
    for kpi in kpis:
        writer.writerow([
            kpi["cliente_id"],
            kpi["cliente_nombre"],
            kpi["volumen_contratado"],
            kpi["volumen_entregado"],
            kpi["volumen_consumido"],
            kpi["almacenamiento_estimado"],
            kpi["margen_estimado"],
        ])
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dashboard_kpis.csv"},
    )


@api_router.get("/dashboard/kpis/export")
def api_export_dashboard_kpis(
    cliente_id: Optional[int] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return export_dashboard_kpis(
        cliente_id=cliente_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        db=db,
    )


@app.get("/dashboard/trend", response_model=schemas.TrendResponse)
def read_dashboard_trend(
    cliente_id: int,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    trend = crud.get_consumo_trend_by_cliente(
        db,
        cliente_id=cliente_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
    )
    if not trend:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return trend


@api_router.get("/dashboard/trend", response_model=schemas.TrendResponse)
def api_read_dashboard_trend(
    cliente_id: int,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return read_dashboard_trend(
        cliente_id=cliente_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        db=db,
    )


@app.post("/alertas/", response_model=schemas.Alerta)
def create_alerta(alerta: schemas.AlertaCreate, db: Session = Depends(get_db)):
    return crud.create_alerta(db, alerta)


@api_router.post("/alertas/", response_model=schemas.Alerta)
def api_create_alerta(alerta: schemas.AlertaCreate, db: Session = Depends(get_db)):
    return crud.create_alerta(db, alerta)


@app.get("/alertas/", response_model=list[schemas.Alerta])
def read_alertas(cliente_id: Optional[int] = None, limit: int = 50, db: Session = Depends(get_db)):
    return crud.get_alertas(db, cliente_id=cliente_id, limit=limit)


@api_router.get("/alertas/", response_model=list[schemas.Alerta])
def api_read_alertas(cliente_id: Optional[int] = None, limit: int = 50, db: Session = Depends(get_db)):
    return crud.get_alertas(db, cliente_id=cliente_id, limit=limit)


app.include_router(api_router)