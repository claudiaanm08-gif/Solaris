from datetime import date, timedelta

from app.database import SessionLocal, engine
from app import models


def seed_data():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(models.Cliente).first():
            return "Seed skipped: data already exists."

        clientes = [
            models.Cliente(
                nombre="EcoMinera Andina",
                rfc="ECO010203AB1",
                direccion="Av. Sustentable 120, Guadalajara",
                email="contacto@ecominera.mx",
                telefono="+52 33 1234 5678",
            ),
            models.Cliente(
                nombre="BioEnergía Norte",
                rfc="BIO040506CD2",
                direccion="Parque Industrial 45, Monterrey",
                email="operaciones@bioenergia.mx",
                telefono="+52 81 2345 6789",
            ),
        ]

        db.add_all(clientes)
        db.flush()

        contrato_1 = models.Contrato(
            cliente_id=clientes[0].id,
            volumen_contratado=1200.0,
            fecha_inicio=date.today() - timedelta(days=120),
            fecha_fin=date.today() + timedelta(days=245),
            condiciones="Suministro garantizado con ventanas flexibles.",
            archivo_pdf=None,
            nombre_archivo=None,
        )
        contrato_2 = models.Contrato(
            cliente_id=clientes[1].id,
            volumen_contratado=900.0,
            fecha_inicio=date.today() - timedelta(days=90),
            fecha_fin=date.today() + timedelta(days=180),
            condiciones="Volumen mensual con ajuste trimestral.",
            archivo_pdf=None,
            nombre_archivo=None,
        )

        db.add_all([contrato_1, contrato_2])
        db.flush()

        entregas = [
            models.Entrega(
                contrato_id=contrato_1.id,
                fecha_entrega=date.today() - timedelta(days=60),
                volumen_entregado=300.0,
                costo_logistico=18.5,
                observaciones="Ruta optimizada con baja emisión.",
            ),
            models.Entrega(
                contrato_id=contrato_1.id,
                fecha_entrega=date.today() - timedelta(days=30),
                volumen_entregado=280.0,
                costo_logistico=17.2,
                observaciones="Entrega puntual.",
            ),
            models.Entrega(
                contrato_id=contrato_2.id,
                fecha_entrega=date.today() - timedelta(days=45),
                volumen_entregado=220.0,
                costo_logistico=15.4,
                observaciones="Ajuste de ruta por clima.",
            ),
        ]

        consumos = [
            models.Consumo(
                contrato_id=contrato_1.id,
                fecha_consumo=date.today() - timedelta(days=50),
                volumen_consumido=260.0,
            ),
            models.Consumo(
                contrato_id=contrato_1.id,
                fecha_consumo=date.today() - timedelta(days=20),
                volumen_consumido=210.0,
            ),
            models.Consumo(
                contrato_id=contrato_2.id,
                fecha_consumo=date.today() - timedelta(days=35),
                volumen_consumido=180.0,
            ),
        ]

        alertas = [
            models.Alerta(
                cliente_id=clientes[0].id,
                nivel="verde",
                mensaje="Consumo dentro de lo previsto.",
            ),
            models.Alerta(
                cliente_id=clientes[1].id,
                nivel="amarillo",
                mensaje="Variación moderada en entregas.",
            ),
        ]

        db.add_all(entregas + consumos + alertas)
        db.commit()
        return "Seed completed: sample data inserted."
    finally:
        db.close()


if __name__ == "__main__":
    print(seed_data())
