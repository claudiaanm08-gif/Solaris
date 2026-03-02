from datetime import date
from app.database import SessionLocal
from app import models, crud


def seed_proyeccion():
    session = SessionLocal()
    try:
        contratos = session.query(models.Contrato).order_by(models.Contrato.id).all()
        if not contratos:
            print("No hay contratos para sembrar.")
            return

        updated = 0
        for contrato in contratos[:3]:
            cliente_id = contrato.cliente_id
            proyeccion = crud.get_proyecciones_reabastecimiento(session, cliente_id=cliente_id)
            if not proyeccion:
                continue
            dias = proyeccion[0].get("dias_para_reabastecimiento")
            if dias is not None and dias > 0:
                continue

            entrega = models.Entrega(
                contrato_id=contrato.id,
                fecha_entrega=date.today(),
                volumen_entregado=500,
                costo_logistico=150,
                observaciones="Entrega adicional para demo de proyecciones",
            )
            session.add(entrega)
            updated += 1

        if updated:
            session.commit()
            print(f"Se añadieron {updated} entregas para proyecciones.")
        else:
            print("Las proyecciones ya tenían días positivos.")
    finally:
        session.close()


if __name__ == "__main__":
    seed_proyeccion()
