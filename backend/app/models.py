from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    rfc = Column(String, unique=True, nullable=False)
    direccion = Column(String)
    email = Column(String)
    telefono = Column(String)

    contratos = relationship("Contrato", back_populates="cliente", cascade="all, delete-orphan")


class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    volumen_contratado = Column(Float, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    condiciones = Column(Text)

    cliente = relationship("Cliente", back_populates="contratos")
    entregas = relationship("Entrega", back_populates="contrato", cascade="all, delete-orphan")
    consumos = relationship("Consumo", back_populates="contrato", cascade="all, delete-orphan")


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