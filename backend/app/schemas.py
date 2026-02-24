from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class ClienteBase(BaseModel):
    nombre: str
    rfc: str
    direccion: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None

class ClienteCreate(ClienteBase):
    pass

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    rfc: Optional[str] = None
    direccion: Optional[str] = None
    email: Optional[str] = None
    telefono: Optional[str] = None

class Cliente(ClienteBase):
    id: int
    class Config:
        from_attributes = True

class ContratoBase(BaseModel):
    cliente_id: int
    volumen_contratado: float
    fecha_inicio: date
    fecha_fin: date
    condiciones: Optional[str] = None

class ContratoCreate(ContratoBase):
    pass

class Contrato(ContratoBase):
    id: int
    archivo_pdf: Optional[str] = None
    nombre_archivo: Optional[str] = None
    fecha_subida: Optional[datetime] = None

    class Config:
        from_attributes = True


class EntregaBase(BaseModel):
    contrato_id: int
    fecha_entrega: date
    volumen_entregado: float
    costo_logistico: Optional[float] = None
    observaciones: Optional[str] = None


class EntregaCreate(EntregaBase):
    pass


class Entrega(EntregaBase):
    id: int
    class Config:
        from_attributes = True


class ConsumoBase(BaseModel):
    contrato_id: int
    fecha_consumo: date
    volumen_consumido: float


class ConsumoCreate(ConsumoBase):
    pass


class Consumo(ConsumoBase):
    id: int
    class Config:
        from_attributes = True


class VariacionContrato(BaseModel):
    contrato_id: int
    volumen_contratado: float
    consumo_total: float
    variacion: float


class DashboardKPI(BaseModel):
    cliente_id: int
    cliente_nombre: str
    volumen_contratado: float
    volumen_entregado: float
    volumen_consumido: float
    almacenamiento_estimado: float
    margen_estimado: float


class TrendPoint(BaseModel):
    fecha: date
    volumen_consumido: float


class TrendResponse(BaseModel):
    cliente_id: int
    cliente_nombre: str
    puntos: list[TrendPoint]


class AlertaBase(BaseModel):
    cliente_id: Optional[int] = None
    nivel: str
    mensaje: str


class AlertaCreate(AlertaBase):
    pass


class Alerta(AlertaBase):
    id: int
    fecha: datetime

    class Config:
        from_attributes = True


class CotizacionBase(BaseModel):
    cliente_id: int | None = None
    fecha: date | None = None
    monto_estimado: float | None = None
    notas: str | None = None


class Cotizacion(CotizacionBase):
    id: int
    class Config:
        from_attributes = True