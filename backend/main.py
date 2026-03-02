from fastapi import FastAPI, Depends, HTTPException, APIRouter, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from app import crud, models, schemas
from app.database import SessionLocal, engine

import os
import shutil
import csv
import io
import json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from fastapi import File, UploadFile
from datetime import date, datetime
from typing import Optional
import re
import logging
from PyPDF2 import PdfReader
from ibm_watson import DiscoveryV2, ApiException
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator

from fastapi.responses import FileResponse


# Crear tablas si no existen
models.Base.metadata.create_all(bind=engine)


def ensure_contratos_columns():
    inspector = inspect(engine)
    if "contratos" not in inspector.get_table_names():
        return

    existing = {col["name"] for col in inspector.get_columns("contratos")}
    required = {
        "archivo_pdf": "TEXT",
        "nombre_archivo": "TEXT",
        "fecha_subida": "DATE",
    }
    missing = {name: col_type for name, col_type in required.items() if name not in existing}
    if not missing:
        return

    with engine.begin() as connection:
        for name, col_type in missing.items():
            connection.execute(text(f"ALTER TABLE contratos ADD COLUMN {name} {col_type}"))

app = FastAPI()
api_router = APIRouter(prefix="/api")

logger = logging.getLogger("rag")

WATSON_DISCOVERY_API_KEY = os.getenv("WATSON_DISCOVERY_API_KEY")
WATSON_DISCOVERY_URL = os.getenv("WATSON_DISCOVERY_URL")
WATSON_DISCOVERY_PROJECT_ID = os.getenv("WATSON_DISCOVERY_PROJECT_ID")
WATSON_DISCOVERY_COLLECTION_ID = os.getenv("WATSON_DISCOVERY_COLLECTION_ID")
_discovery_client = None


@app.on_event("startup")
def _startup_schema_check():
    ensure_contratos_columns()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "message": "Solaris API running"}

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
    _index_contrato_pdf(db, db_contrato)
    return db_contrato


def _extract_text_from_pdf(file_path: str):
    try:
        with open(file_path, "rb") as file:
            reader = PdfReader(file)
            pages_text = []
            for page in reader.pages:
                text = page.extract_text() or ""
                pages_text.append(text)
            return "\n".join(pages_text).strip()
    except Exception as exc:
        logger.exception("Error al extraer texto del PDF: %s", exc)
        return ""


def _get_discovery_client():
    global _discovery_client
    if _discovery_client is not None:
        return _discovery_client
    if not all(
        [
            WATSON_DISCOVERY_API_KEY,
            WATSON_DISCOVERY_URL,
            WATSON_DISCOVERY_PROJECT_ID,
            WATSON_DISCOVERY_COLLECTION_ID,
        ]
    ):
        return None
    authenticator = IAMAuthenticator(WATSON_DISCOVERY_API_KEY)
    client = DiscoveryV2(version="2023-03-31", authenticator=authenticator)
    client.set_service_url(WATSON_DISCOVERY_URL)
    _discovery_client = client
    return client


def _split_text(text: str, chunk_size: int = 800, overlap: int = 120):
    if not text:
        return []
    cleaned = " ".join(text.split())
    chunks = []
    start = 0
    while start < len(cleaned):
        end = min(start + chunk_size, len(cleaned))
        chunks.append(cleaned[start:end])
        if end == len(cleaned):
            break
        start = max(end - overlap, 0)
    return chunks


def _extract_structured_fields(text: str) -> dict:
    if not text:
        return {"montos": [], "fechas": [], "porcentajes": [], "clausulas": []}

    montos = re.findall(r"\$\s?\d{1,3}(?:,\d{3})*(?:\.\d+)?", text)
    porcentajes = re.findall(r"\b\d{1,3}(?:\.\d+)?%", text)
    fechas = re.findall(
        r"\b\d{1,2}\s+de\s+[A-Za-zÁÉÍÓÚáéíóúñÑ]+\s+de\s+\d{4}\b",
        text,
    )
    clausulas = re.findall(r"\bCLÁUSULA\s+[A-ZÁÉÍÓÚÑ]+\b", text, flags=re.IGNORECASE)

    return {
        "montos": list(dict.fromkeys(montos))[:5],
        "fechas": list(dict.fromkeys(fechas))[:5],
        "porcentajes": list(dict.fromkeys(porcentajes))[:5],
        "clausulas": list(dict.fromkeys(clausulas))[:5],
    }


def _index_contrato_pdf(db: Session, contrato: models.Contrato):
    if not contrato.archivo_pdf:
        return 0
    texto = _extract_text_from_pdf(contrato.archivo_pdf)
    if not texto:
        logger.info("Contrato %s sin texto extraído", contrato.id)
        return 0
    chunks = _split_text(texto)
    total = crud.replace_contrato_documentos(db, contrato.id, chunks)
    logger.info("Contrato %s indexado localmente con %s fragmentos", contrato.id, total)

    discovery_client = _get_discovery_client()
    if discovery_client:
        try:
            metadata = json.dumps(
                {
                    "contrato_id": contrato.id,
                    "cliente_id": contrato.cliente_id,
                    "cliente_nombre": contrato.cliente.nombre if contrato.cliente else "",
                }
            )
            with open(contrato.archivo_pdf, "rb") as file:
                discovery_client.add_document(
                    project_id=WATSON_DISCOVERY_PROJECT_ID,
                    collection_id=WATSON_DISCOVERY_COLLECTION_ID,
                    file=file,
                    filename=os.path.basename(contrato.archivo_pdf),
                    file_content_type="application/pdf",
                    metadata=metadata,
                )
            logger.info("Contrato %s indexado en Watson Discovery", contrato.id)
        except ApiException as exc:
            logger.exception("Error al indexar contrato en Watson Discovery: %s", exc)
        except Exception as exc:
            logger.exception("Error inesperado en Watson Discovery: %s", exc)

    return total


def _validate_simulacion_request(request: schemas.SimulacionAhorroRequest):
    if request.precio_solensa <= 0:
        raise HTTPException(status_code=400, detail="El precio Solensa debe ser mayor a 0")
    if request.precio_alternativo <= 0:
        raise HTTPException(status_code=400, detail="El precio alternativo debe ser mayor a 0")
    if request.volumen_estimado is not None and request.volumen_estimado <= 0:
        raise HTTPException(status_code=400, detail="El volumen estimado debe ser mayor a 0")


def _build_propuesta_pdf(request: schemas.PropuestaAhorroRequest, simulacion: dict):
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50

    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(40, y, "Propuesta de ahorro energético")
    y -= 24
    pdf.setFont("Helvetica", 10)
    pdf.drawString(40, y, f"Fecha de emisión: {datetime.utcnow().date().isoformat()}")
    y -= 24

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, y, "Datos del prospecto")
    y -= 18
    pdf.setFont("Helvetica", 10)
    pdf.drawString(40, y, f"Nombre: {request.prospecto_nombre}")
    y -= 14
    if request.prospecto_empresa:
        pdf.drawString(40, y, f"Empresa: {request.prospecto_empresa}")
        y -= 14
    if request.prospecto_email:
        pdf.drawString(40, y, f"Email: {request.prospecto_email}")
        y -= 14
    if request.prospecto_telefono:
        pdf.drawString(40, y, f"Teléfono: {request.prospecto_telefono}")
        y -= 14

    y -= 10
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, y, "Resumen de simulación")
    y -= 18
    pdf.setFont("Helvetica", 10)
    pdf.drawString(40, y, f"Cliente referencia: {simulacion['cliente_nombre']}")
    y -= 14
    pdf.drawString(40, y, f"Periodo analizado: {simulacion['periodo_inicio']} → {simulacion['periodo_fin']}")
    y -= 14
    pdf.drawString(40, y, f"Volumen base ({simulacion['fuente_volumen']}): {simulacion['volumen_base']:.2f}")
    y -= 14
    pdf.drawString(40, y, f"Precio Solensa: {simulacion['precio_solensa']:.2f}")
    y -= 14
    pdf.drawString(40, y, f"Precio alternativo: {simulacion['precio_alternativo']:.2f}")
    y -= 14
    pdf.drawString(40, y, f"Costo Solensa: {simulacion['costo_solensa']:.2f}")
    y -= 14
    pdf.drawString(40, y, f"Costo alternativo: {simulacion['costo_alternativo']:.2f}")
    y -= 14
    pdf.drawString(40, y, f"Ahorro estimado: {simulacion['ahorro_estimado']:.2f}")
    y -= 14
    pdf.drawString(40, y, f"Porcentaje de ahorro: {simulacion['porcentaje_ahorro']:.1f}%")
    y -= 20

    if request.notas:
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(40, y, "Notas")
        y -= 16
        pdf.setFont("Helvetica", 10)
        for line in request.notas.splitlines():
            if y < 60:
                pdf.showPage()
                y = height - 50
                pdf.setFont("Helvetica", 10)
            pdf.drawString(40, y, line)
            y -= 12

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return buffer


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


# endpoints para Proyecciones de reabastecimiento
@app.get("/proyecciones", response_model=list[schemas.ProyeccionReabastecimiento])
def read_proyecciones(
    cliente_id: Optional[int] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return crud.get_proyecciones_reabastecimiento(
        db,
        cliente_id=cliente_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
    )


@api_router.get("/proyecciones", response_model=list[schemas.ProyeccionReabastecimiento])
def api_read_proyecciones(
    cliente_id: Optional[int] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return read_proyecciones(
        cliente_id=cliente_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        db=db,
    )


@app.get("/proyecciones/export")
def export_proyecciones(
    cliente_id: Optional[int] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    proyecciones = crud.get_proyecciones_reabastecimiento(
        db,
        cliente_id=cliente_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "cliente_id",
        "cliente_nombre",
        "periodo_inicio",
        "periodo_fin",
        "consumo_promedio_diario",
        "almacenamiento_estimado",
        "dias_para_reabastecimiento",
        "fecha_reabastecimiento_estimada",
    ])
    for item in proyecciones:
        writer.writerow([
            item["cliente_id"],
            item["cliente_nombre"],
            item["periodo_inicio"],
            item["periodo_fin"],
            item["consumo_promedio_diario"],
            item["almacenamiento_estimado"],
            item.get("dias_para_reabastecimiento"),
            item.get("fecha_reabastecimiento_estimada"),
        ])
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=proyecciones_reabastecimiento.csv"},
    )


@api_router.get("/proyecciones/export")
def api_export_proyecciones(
    cliente_id: Optional[int] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return export_proyecciones(
        cliente_id=cliente_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        db=db,
    )


@app.get("/proyecciones/export/pdf")
def export_proyecciones_pdf(
    cliente_id: Optional[int] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    proyecciones = crud.get_proyecciones_reabastecimiento(
        db,
        cliente_id=cliente_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
    )
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 40

    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(40, y, "Proyecciones de reabastecimiento")
    y -= 30

    pdf.setFont("Helvetica", 10)
    for item in proyecciones:
        if y < 80:
            pdf.showPage()
            y = height - 40
        pdf.drawString(40, y, f"Cliente: {item['cliente_nombre']} (ID {item['cliente_id']})")
        y -= 14
        pdf.drawString(40, y, f"Periodo: {item['periodo_inicio']} → {item['periodo_fin']}")
        y -= 14
        pdf.drawString(40, y, f"Consumo promedio diario: {item['consumo_promedio_diario']:.2f}")
        y -= 14
        pdf.drawString(40, y, f"Almacenamiento estimado: {item['almacenamiento_estimado']:.2f}")
        y -= 14
        dias = item.get("dias_para_reabastecimiento")
        fecha = item.get("fecha_reabastecimiento_estimada")
        pdf.drawString(40, y, f"Días para reabastecer: {dias:.1f}" if dias is not None else "Días para reabastecer: N/D")
        y -= 14
        pdf.drawString(40, y, f"Fecha estimada: {fecha}" if fecha else "Fecha estimada: N/D")
        y -= 24

    pdf.save()
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=proyecciones_reabastecimiento.pdf"},
    )


@api_router.get("/proyecciones/export/pdf")
def api_export_proyecciones_pdf(
    cliente_id: Optional[int] = None,
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    return export_proyecciones_pdf(
        cliente_id=cliente_id,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        db=db,
    )


@app.post("/rag/reindex", response_model=schemas.RagIndexResponse)
def reindex_rag(request: schemas.RagIndexRequest, db: Session = Depends(get_db)):
    contratos_query = db.query(models.Contrato)
    if request.contrato_id:
        contratos_query = contratos_query.filter(models.Contrato.id == request.contrato_id)
    contratos = contratos_query.all()
    total_contratos = 0
    total_docs = 0
    for contrato in contratos:
        total_docs += _index_contrato_pdf(db, contrato)
        total_contratos += 1
    return {
        "contratos_indexados": total_contratos,
        "documentos_indexados": total_docs,
    }


@api_router.post("/rag/reindex", response_model=schemas.RagIndexResponse)
def api_reindex_rag(request: schemas.RagIndexRequest, db: Session = Depends(get_db)):
    return reindex_rag(request=request, db=db)


@app.post("/rag/query", response_model=schemas.RagQueryResponse)
def rag_query(request: schemas.RagQueryRequest, db: Session = Depends(get_db)):
    if not request.pregunta.strip():
        raise HTTPException(status_code=400, detail="La pregunta es obligatoria")
    discovery_client = _get_discovery_client()
    if discovery_client:
        try:
            filter_expr = None
            if request.cliente_id:
                filter_expr = f"metadata.cliente_id:{request.cliente_id}"

            response = discovery_client.query(
                project_id=WATSON_DISCOVERY_PROJECT_ID,
                collection_id=WATSON_DISCOVERY_COLLECTION_ID,
                natural_language_query=request.pregunta,
                filter=filter_expr,
                passages=True,
                passages_count=max(request.top_k, 1),
                count=max(request.top_k, 1),
            ).get_result()

            passages = response.get("passages", [])
            respuesta = " ".join(
                (p.get("passage_text") or "").strip() for p in passages[: request.top_k]
            ).strip()

            fuentes = []
            for result in response.get("results", [])[: request.top_k]:
                metadata = result.get("metadata", {}) or {}
                fragmento = (
                    result.get("text")
                    or result.get("excerpt")
                    or (passages[0].get("passage_text") if passages else "")
                    or ""
                )
                fuentes.append(
                    {
                        "contrato_id": metadata.get("contrato_id", 0),
                        "cliente_nombre": metadata.get("cliente_nombre", ""),
                        "score": float(result.get("score", 0)),
                        "fragmento": fragmento[:240].replace("\n", " ").strip(),
                    }
                )

            if not respuesta:
                respuesta = "No se encontró información relevante en los contratos indexados."

            return {
                "pregunta": request.pregunta,
                "respuesta": respuesta,
                "fuentes": fuentes,
            }
        except ApiException as exc:
            logger.exception("Error en consulta Watson Discovery: %s", exc)
        except Exception as exc:
            logger.exception("Error inesperado en Watson Discovery: %s", exc)

    result = crud.query_rag(
        db,
        pregunta=request.pregunta,
        cliente_id=request.cliente_id,
        top_k=request.top_k,
    )
    return {
        "pregunta": request.pregunta,
        "respuesta": result["respuesta"],
        "fuentes": result["fuentes"],
    }


@app.post("/rag/snippets", response_model=schemas.RagSnippetResponse)
def rag_snippets(request: schemas.RagSnippetRequest):
    return api_rag_snippets(request=request)


@api_router.post("/rag/query", response_model=schemas.RagQueryResponse)
def api_rag_query(request: schemas.RagQueryRequest, db: Session = Depends(get_db)):
    return rag_query(request=request, db=db)


@api_router.post("/rag/snippets", response_model=schemas.RagSnippetResponse)
def api_rag_snippets(request: schemas.RagSnippetRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="La consulta es obligatoria")
    discovery_client = _get_discovery_client()
    if not discovery_client:
        raise HTTPException(status_code=503, detail="Watson Discovery no configurado")

    filter_expr = None
    if request.cliente_id:
        filter_expr = f"metadata.cliente_id:{request.cliente_id}"
    if request.contrato_id:
        clause = f"metadata.contrato_id:{request.contrato_id}"
        filter_expr = clause if not filter_expr else f"{filter_expr}, {clause}"
    if request.clause_type:
        clause = f"metadata.tipo_clausula:{request.clause_type}"
        filter_expr = clause if not filter_expr else f"{filter_expr}, {clause}"

    try:
        response = discovery_client.query(
            project_id=WATSON_DISCOVERY_PROJECT_ID,
            collection_id=WATSON_DISCOVERY_COLLECTION_ID,
            natural_language_query=request.query,
            filter=filter_expr,
            count=max(request.limit, 1),
        ).get_result()
    except ApiException as exc:
        logger.exception("Error en consulta Watson Discovery: %s", exc)
        raise HTTPException(status_code=502, detail="Error en Watson Discovery")

    fragments = []
    for result in response.get("results", [])[: request.limit]:
        text = result.get("text") or result.get("extracted_text") or ""
        if isinstance(text, list):
            text = " ".join(str(item) for item in text)
        if not isinstance(text, str):
            text = str(text)

        structured = _extract_structured_fields(text)

        fragments.append(
            {
                "document_id": result.get("document_id"),
                "title": result.get("title"),
                "score": result.get("result_metadata", {}).get("score"),
                "text": text.strip()[:1200],
                "montos": structured["montos"],
                "fechas": structured["fechas"],
                "porcentajes": structured["porcentajes"],
                "clausulas": structured["clausulas"],
            }
        )

    return {
        "query": request.query,
        "matching_results": response.get("matching_results", 0),
        "fragments": fragments,
    }


@app.post("/simulaciones/ahorro", response_model=schemas.SimulacionAhorroResponse)
def create_simulacion_ahorro(
    request: schemas.SimulacionAhorroRequest,
    db: Session = Depends(get_db)
):
    _validate_simulacion_request(request)
    result = crud.compute_simulacion_ahorro(db, request)
    if not result:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return result


@api_router.post("/simulaciones/ahorro", response_model=schemas.SimulacionAhorroResponse)
def api_create_simulacion_ahorro(
    request: schemas.SimulacionAhorroRequest,
    db: Session = Depends(get_db)
):
    return create_simulacion_ahorro(request=request, db=db)


@app.post("/simulaciones/ahorro/propuesta")
def create_propuesta_ahorro(
    request: schemas.PropuestaAhorroRequest,
    db: Session = Depends(get_db)
):
    _validate_simulacion_request(request)
    simulacion = crud.compute_simulacion_ahorro(db, request)
    if not simulacion:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    buffer = _build_propuesta_pdf(request, simulacion)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=propuesta_ahorro.pdf"},
    )


@api_router.post("/simulaciones/ahorro/propuesta")
def api_create_propuesta_ahorro(
    request: schemas.PropuestaAhorroRequest,
    db: Session = Depends(get_db)
):
    return create_propuesta_ahorro(request=request, db=db)


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