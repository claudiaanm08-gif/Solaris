from datetime import date, timedelta
from app.database import SessionLocal
from app import models


def seed_simulador():
    session = SessionLocal()
    try:
        clientes = session.query(models.Cliente).order_by(models.Cliente.id).all()
        if not clientes:
            print("No hay clientes para sembrar.")
            return

        existing_consumos = session.query(models.Consumo).count()
        existing_entregas = session.query(models.Entrega).count()
        if existing_consumos > 0 or existing_entregas > 0:
            print("Ya existen entregas o consumos, no se realizará siembra.")
            return

        contratos = session.query(models.Contrato).all()
        contratos_map = {contrato.cliente_id: contrato for contrato in contratos}

        today = date.today()
        for idx, cliente in enumerate(clientes[:3], start=1):
            contrato = contratos_map.get(cliente.id)
            if not contrato:
                contrato = models.Contrato(
                    cliente_id=cliente.id,
                    volumen_contratado=1000 + idx * 200,
                    fecha_inicio=today - timedelta(days=90),
                    fecha_fin=today + timedelta(days=180),
                    condiciones="Contrato generado para demo",
                )
                session.add(contrato)
                session.flush()

            for step in range(3):
                fecha_entrega = today - timedelta(days=30 * (step + 1))
                entrega = models.Entrega(
                    contrato_id=contrato.id,
                    fecha_entrega=fecha_entrega,
                    volumen_entregado=350 + idx * 50 + step * 25,
                    costo_logistico=120 + idx * 10,
                    observaciones="Entrega demo"
                )
                session.add(entrega)

            for step in range(4):
                fecha_consumo = today - timedelta(days=20 * (step + 1))
                consumo = models.Consumo(
                    contrato_id=contrato.id,
                    fecha_consumo=fecha_consumo,
                    volumen_consumido=180 + idx * 30 + step * 15,
                )
                session.add(consumo)

        session.commit()
        print("Siembra de simulador completada.")
    finally:
        session.close()


if __name__ == "__main__":
    seed_simulador()
