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


class ProyeccionReabastecimiento(BaseModel):
    cliente_id: int
    cliente_nombre: str
    periodo_inicio: date
    periodo_fin: date
    consumo_promedio_diario: float
    almacenamiento_estimado: float
    dias_para_reabastecimiento: Optional[float] = None
    fecha_reabastecimiento_estimada: Optional[date] = None


class ProyeccionFinanciera(BaseModel):
    cliente_id: int
    anio: int
    ingreso_estimado: float
    costo_estimado: float
    margen_estimado: float


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


class SimulacionAhorroRequest(BaseModel):
    cliente_id: int
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    precio_solensa: float
    precio_alternativo: float
    volumen_estimado: Optional[float] = None


class SimulacionAhorroResponse(BaseModel):
    cliente_id: int
    cliente_nombre: str
    periodo_inicio: date
    periodo_fin: date
    volumen_base: float
    fuente_volumen: str
    precio_solensa: float
    precio_alternativo: float
    costo_solensa: float
    costo_alternativo: float
    ahorro_estimado: float
    porcentaje_ahorro: float


class PropuestaAhorroRequest(SimulacionAhorroRequest):
    prospecto_nombre: str
    prospecto_empresa: Optional[str] = None
    prospecto_email: Optional[str] = None
    prospecto_telefono: Optional[str] = None
    notas: Optional[str] = None


class RagIndexRequest(BaseModel):
    contrato_id: Optional[int] = None


class RagIndexResponse(BaseModel):
    contratos_indexados: int
    documentos_indexados: int


class RagQueryRequest(BaseModel):
    pregunta: str
    cliente_id: Optional[int] = None
    top_k: int = 3


class RagFuente(BaseModel):
    contrato_id: int
    cliente_nombre: str
    score: float
    fragmento: str


class RagQueryResponse(BaseModel):
    pregunta: str
    respuesta: str
    fuentes: list[RagFuente]


class RagSnippetRequest(BaseModel):
    query: str
    limit: int = 3
    cliente_id: Optional[int] = None
    contrato_id: Optional[int] = None
    clause_type: Optional[str] = None


class RagSnippet(BaseModel):
    document_id: str | None = None
    title: str | None = None
    score: float | None = None
    text: str
    montos: list[str] = []
    fechas: list[str] = []
    porcentajes: list[str] = []
    clausulas: list[str] = []


class RagSnippetResponse(BaseModel):
    query: str
    matching_results: int
    fragments: list[RagSnippet]