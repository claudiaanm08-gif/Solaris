from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    rfc = Column(String, unique=True, nullable=False)
    direccion = Column(String)
    email = Column(String)
    telefono = Column(String)

    contratos = relationship("Contrato", back_populates="cliente", cascade="all, delete-orphan")
    proyecciones_financieras = relationship(
        "ProyeccionFinanciera", back_populates="cliente", cascade="all, delete-orphan"
    )


class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    volumen_contratado = Column(Float, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    condiciones = Column(Text)
    archivo_pdf = Column(String)  # Ruta al archivo
    nombre_archivo = Column(String)  # Nombre original
    fecha_subida = Column(DateTime, default=datetime.utcnow)  # Nuevo campo

    cliente = relationship("Cliente", back_populates="contratos")
    entregas = relationship("Entrega", back_populates="contrato")
    consumos = relationship("Consumo", back_populates="contrato")
    documentos = relationship("ContratoDocumento", back_populates="contrato", cascade="all, delete-orphan")


class Entrega(Base):
    __tablename__ = "entregas"

    id = Column(Integer, primary_key=True, index=True)
    contrato_id = Column(Integer, ForeignKey("contratos.id"), nullable=False)
    fecha_entrega = Column(Date, nullable=False)
    volumen_entregado = Column(Float, nullable=False)
    costo_logistico = Column(Float)
    observaciones = Column(Text)

    contrato = relationship("Contrato", back_populates="entregas")


class Consumo(Base):
    __tablename__ = "consumos"

    id = Column(Integer, primary_key=True, index=True)
    contrato_id = Column(Integer, ForeignKey("contratos.id"), nullable=False)
    fecha_consumo = Column(Date, nullable=False)
    volumen_consumido = Column(Float, nullable=False)

    contrato = relationship("Contrato", back_populates="consumos")


class Alerta(Base):
    __tablename__ = "alertas"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    nivel = Column(String, nullable=False)  # verde | amarillo | rojo
    mensaje = Column(String, nullable=False)
    fecha = Column(DateTime, default=datetime.utcnow, nullable=False)

    cliente = relationship("Cliente")


class ContratoDocumento(Base):
    __tablename__ = "contrato_documentos"

    id = Column(Integer, primary_key=True, index=True)
    contrato_id = Column(Integer, ForeignKey("contratos.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    contenido = Column(Text, nullable=False)
    fecha_indexado = Column(DateTime, default=datetime.utcnow, nullable=False)

    contrato = relationship("Contrato", back_populates="documentos")


class ProyeccionFinanciera(Base):
    __tablename__ = "proyecciones_financieras"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    anio = Column(Integer, nullable=False)
    ingreso_estimado = Column(Float, nullable=False)
    costo_estimado = Column(Float, nullable=False)
    margen_estimado = Column(Float, nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow, nullable=False)

    cliente = relationship("Cliente", back_populates="proyecciones_financieras")