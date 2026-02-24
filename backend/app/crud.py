from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from . import models, schemas

# Obtener cliente por ID
def get_cliente(db: Session, cliente_id: int):
    return db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()

# Obtener todos los clientes (con paginación opcional)
def get_clientes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Cliente).offset(skip).limit(limit).all()

# Crear un nuevo cliente
def create_cliente(db: Session, cliente: schemas.ClienteCreate):
    db_cliente = models.Cliente(**cliente.dict())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

# Actualizar un cliente existente
def update_cliente(db: Session, cliente_id: int, cliente: schemas.ClienteUpdate):
    db_cliente = get_cliente(db, cliente_id)
    if db_cliente:
        for key, value in cliente.dict(exclude_unset=True).items():
            setattr(db_cliente, key, value)
        db.commit()
        db.refresh(db_cliente)
    return db_cliente

# Eliminar un cliente
def delete_cliente(db: Session, cliente_id: int):
    db_cliente = get_cliente(db, cliente_id)
    if db_cliente:
        db.delete(db_cliente)
        db.commit()
        return True
    return False


def get_contratos_by_cliente(db: Session, cliente_id: int):
    return db.query(models.Contrato).filter(models.Contrato.cliente_id == cliente_id).all()


def create_entrega(db: Session, entrega: schemas.EntregaCreate):
    db_entrega = models.Entrega(**entrega.dict())
    db.add(db_entrega)
    db.commit()
    db.refresh(db_entrega)
    return db_entrega


def get_entregas_by_cliente(db: Session, cliente_id: int):
    return (
        db.query(models.Entrega)
        .join(models.Contrato)
        .filter(models.Contrato.cliente_id == cliente_id)
        .all()
    )


def get_entregas_by_contrato(db: Session, contrato_id: int):
    return db.query(models.Entrega).filter(models.Entrega.contrato_id == contrato_id).all()


def create_consumo(db: Session, consumo: schemas.ConsumoCreate):
    db_consumo = models.Consumo(**consumo.dict())
    db.add(db_consumo)
    db.commit()
    db.refresh(db_consumo)
    return db_consumo


def get_consumos_by_cliente(db: Session, cliente_id: int):
    return (
        db.query(models.Consumo)
        .join(models.Contrato)
        .filter(models.Contrato.cliente_id == cliente_id)
        .all()
    )


def get_consumos_by_contrato(db: Session, contrato_id: int):
    return db.query(models.Consumo).filter(models.Consumo.contrato_id == contrato_id).all()


def get_variaciones_by_cliente(db: Session, cliente_id: int):
    results = (
        db.query(
            models.Contrato.id.label("contrato_id"),
            models.Contrato.volumen_contratado.label("volumen_contratado"),
            func.coalesce(func.sum(models.Consumo.volumen_consumido), 0).label("consumo_total"),
        )
        .outerjoin(models.Consumo, models.Consumo.contrato_id == models.Contrato.id)
        .filter(models.Contrato.cliente_id == cliente_id)
        .group_by(models.Contrato.id)
        .all()
    )

    return [
        {
            "contrato_id": row.contrato_id,
            "volumen_contratado": row.volumen_contratado,
            "consumo_total": row.consumo_total,
            "variacion": row.volumen_contratado - row.consumo_total,
        }
        for row in results
    ]


def get_variacion_by_contrato(db: Session, contrato_id: int):
    result = (
        db.query(
            models.Contrato.id.label("contrato_id"),
            models.Contrato.volumen_contratado.label("volumen_contratado"),
            func.coalesce(func.sum(models.Consumo.volumen_consumido), 0).label("consumo_total"),
        )
        .outerjoin(models.Consumo, models.Consumo.contrato_id == models.Contrato.id)
        .filter(models.Contrato.id == contrato_id)
        .group_by(models.Contrato.id)
        .first()
    )

    if not result:
        return None

    return {
        "contrato_id": result.contrato_id,
        "volumen_contratado": result.volumen_contratado,
        "consumo_total": result.consumo_total,
        "variacion": result.volumen_contratado - result.consumo_total,
    }


def _apply_date_filter(query, column, fecha_inicio=None, fecha_fin=None):
    if fecha_inicio:
        query = query.filter(column >= fecha_inicio)
    if fecha_fin:
        query = query.filter(column <= fecha_fin)
    return query


def get_dashboard_kpis(db: Session, cliente_id=None, fecha_inicio=None, fecha_fin=None):
    clientes_query = db.query(models.Cliente)
    if cliente_id:
        clientes_query = clientes_query.filter(models.Cliente.id == cliente_id)
    clientes = clientes_query.all()

    kpis = []
    for cliente in clientes:
        contratos = db.query(models.Contrato).filter(models.Contrato.cliente_id == cliente.id).all()
        volumen_contratado = sum(c.volumen_contratado for c in contratos) if contratos else 0

        entregas_query = (
            db.query(func.coalesce(func.sum(models.Entrega.volumen_entregado), 0))
            .join(models.Contrato)
            .filter(models.Contrato.cliente_id == cliente.id)
        )
        entregas_query = _apply_date_filter(entregas_query, models.Entrega.fecha_entrega, fecha_inicio, fecha_fin)
        volumen_entregado = entregas_query.scalar() or 0

        consumos_query = (
            db.query(func.coalesce(func.sum(models.Consumo.volumen_consumido), 0))
            .join(models.Contrato)
            .filter(models.Contrato.cliente_id == cliente.id)
        )
        consumos_query = _apply_date_filter(consumos_query, models.Consumo.fecha_consumo, fecha_inicio, fecha_fin)
        volumen_consumido = consumos_query.scalar() or 0

        almacenamiento_estimado = volumen_entregado - volumen_consumido
        margen_estimado = max(volumen_contratado - volumen_consumido, 0)

        kpis.append(
            {
                "cliente_id": cliente.id,
                "cliente_nombre": cliente.nombre,
                "volumen_contratado": volumen_contratado,
                "volumen_entregado": volumen_entregado,
                "volumen_consumido": volumen_consumido,
                "almacenamiento_estimado": almacenamiento_estimado,
                "margen_estimado": margen_estimado,
            }
        )
    return kpis


def create_alerta(db: Session, alerta: schemas.AlertaCreate):
    start_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    end_day = start_day + timedelta(days=1)
    existing = (
        db.query(models.Alerta)
        .filter(models.Alerta.cliente_id == alerta.cliente_id)
        .filter(models.Alerta.nivel == alerta.nivel)
        .filter(models.Alerta.mensaje == alerta.mensaje)
        .filter(models.Alerta.fecha >= start_day, models.Alerta.fecha < end_day)
        .first()
    )
    if existing:
        return existing

    db_alerta = models.Alerta(**alerta.dict())
    db.add(db_alerta)
    db.commit()
    db.refresh(db_alerta)
    return db_alerta


def get_alertas(db: Session, cliente_id=None, limit: int = 50):
    query = db.query(models.Alerta).order_by(models.Alerta.fecha.desc())
    if cliente_id:
        query = query.filter(models.Alerta.cliente_id == cliente_id)
    return query.limit(limit).all()


def get_consumo_trend_by_cliente(db: Session, cliente_id: int, fecha_inicio=None, fecha_fin=None):
    cliente = get_cliente(db, cliente_id)
    if not cliente:
        return None

    trend_query = (
        db.query(
            models.Consumo.fecha_consumo.label("fecha"),
            func.coalesce(func.sum(models.Consumo.volumen_consumido), 0).label("volumen_consumido"),
        )
        .join(models.Contrato, models.Contrato.id == models.Consumo.contrato_id)
        .filter(models.Contrato.cliente_id == cliente_id)
        .group_by(models.Consumo.fecha_consumo)
        .order_by(models.Consumo.fecha_consumo)
    )
    trend_query = _apply_date_filter(trend_query, models.Consumo.fecha_consumo, fecha_inicio, fecha_fin)
    puntos = [
        {"fecha": row.fecha, "volumen_consumido": float(row.volumen_consumido)}
        for row in trend_query.all()
    ]

    return {
        "cliente_id": cliente.id,
        "cliente_nombre": cliente.nombre,
        "puntos": puntos,
    }