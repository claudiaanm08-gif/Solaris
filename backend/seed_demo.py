from datetime import date, datetime, timedelta

from app.database import SessionLocal, engine
from app import models


def _add_months(base_date: date, months: int) -> date:
    year = base_date.year + (base_date.month - 1 + months) // 12
    month = (base_date.month - 1 + months) % 12 + 1
    day = min(base_date.day, 28)
    return date(year, month, day)


def seed_demo():
    models.Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    inserted = {
        "clientes": 0,
        "contratos": 0,
        "consumos": 0,
        "entregas": 0,
        "alertas": 0,
        "proyecciones_financieras": 0,
    }
    try:
        demo_clientes = [
            {
                "nombre": "Aceros del Valle",
                "rfc": "ACV021214AA1",
                "direccion": "Parque Industrial Norte 120, Monterrey",
                "email": "operaciones@acerosvalle.mx",
                "telefono": "+52 81 4488 1200",
            },
            {
                "nombre": "Minería Horizonte",
                "rfc": "MIH030518BB2",
                "direccion": "Blvd. Minero 245, Hermosillo",
                "email": "logistica@horizontemx.com",
                "telefono": "+52 662 258 4301",
            },
            {
                "nombre": "Química Altiplano",
                "rfc": "QUI041123CC3",
                "direccion": "Av. Ciencia 84, San Luis Potosí",
                "email": "compras@altiplanoq.com",
                "telefono": "+52 444 190 7721",
            },
            {
                "nombre": "Energía Sierra Norte",
                "rfc": "ESN050707DD4",
                "direccion": "Carretera Federal 45, Chihuahua",
                "email": "supply@sierranorte.mx",
                "telefono": "+52 614 390 5512",
            },
            {
                "nombre": "Agroindustrial Terra",
                "rfc": "AIT061030EE5",
                "direccion": "Zona Agro 310, Culiacán",
                "email": "contacto@terraagro.mx",
                "telefono": "+52 667 312 9087",
            },
        ]

        clientes_map = {}
        existing_clients = {
            cliente.rfc: cliente
            for cliente in session.query(models.Cliente).filter(models.Cliente.rfc.in_([c["rfc"] for c in demo_clientes])).all()
        }

        for payload in demo_clientes:
            cliente = existing_clients.get(payload["rfc"])
            if not cliente:
                cliente = models.Cliente(**payload)
                session.add(cliente)
                session.flush()
                inserted["clientes"] += 1
            clientes_map[payload["rfc"]] = cliente

        today = date.today()
        contract_specs = [
            ("Activo", -300, 210, 1.0),
            ("Vencido", -900, -120, 0.85),
        ]

        contratos = []
        for cliente in clientes_map.values():
            existing_contratos = (
                session.query(models.Contrato)
                .filter(models.Contrato.cliente_id == cliente.id)
                .order_by(models.Contrato.id)
                .all()
            )

            while len(existing_contratos) < 2:
                label, start_offset, end_offset, factor = contract_specs[len(existing_contratos) % 2]
                volumen = 1100.0 * factor + (cliente.id % 4) * 75.5
                contrato = models.Contrato(
                    cliente_id=cliente.id,
                    volumen_contratado=volumen,
                    fecha_inicio=today + timedelta(days=start_offset),
                    fecha_fin=today + timedelta(days=end_offset),
                    condiciones=f"Contrato {label} demo con cláusulas de sostenibilidad.",
                )
                session.add(contrato)
                session.flush()
                inserted["contratos"] += 1
                existing_contratos.append(contrato)

            contratos.extend(existing_contratos[:2])

        for contrato in contratos:
            consumo_count = (
                session.query(models.Consumo)
                .filter(models.Consumo.contrato_id == contrato.id)
                .count()
            )
            entrega_count = (
                session.query(models.Entrega)
                .filter(models.Entrega.contrato_id == contrato.id)
                .count()
            )

            end_date = min(today, contrato.fecha_fin)
            base_month = date(end_date.year, end_date.month, 1)

            if consumo_count < 12:
                for idx in range(12):
                    fecha = _add_months(base_month, -idx)
                    volumen = (contrato.volumen_contratado / 12) * (0.78 + (idx % 4) * 0.04)
                    consumo = models.Consumo(
                        contrato_id=contrato.id,
                        fecha_consumo=fecha,
                        volumen_consumido=round(volumen, 2),
                    )
                    session.add(consumo)
                    inserted["consumos"] += 1

            if entrega_count < 8:
                for idx in range(8):
                    fecha = _add_months(base_month, -idx)
                    volumen = (contrato.volumen_contratado / 10) * (0.82 + (idx % 3) * 0.05)
                    entrega = models.Entrega(
                        contrato_id=contrato.id,
                        fecha_entrega=fecha,
                        volumen_entregado=round(volumen, 2),
                        costo_logistico=round(125.5 + (idx % 4) * 9.3, 2),
                        observaciones="Entrega programada con ajustes de demanda.",
                    )
                    session.add(entrega)
                    inserted["entregas"] += 1

        demo_alertas = [
            ("verde", "[DEMO] Operación estable, seguimiento semanal."),
            ("amarillo", "[DEMO] Variación moderada en consumo, revisar planificación."),
            ("rojo", "[DEMO] Entregas críticas, activar protocolo de suministro."),
        ]

        for cliente in clientes_map.values():
            existing_alerts = (
                session.query(models.Alerta)
                .filter(models.Alerta.cliente_id == cliente.id)
                .filter(models.Alerta.mensaje.ilike("%[DEMO]%"))
                .count()
            )
            if existing_alerts:
                continue

            for idx, (nivel, mensaje) in enumerate(demo_alertas[:2]):
                alerta = models.Alerta(
                    cliente_id=cliente.id,
                    nivel=nivel,
                    mensaje=mensaje,
                    fecha=datetime.utcnow() - timedelta(days=10 * (idx + 1)),
                )
                session.add(alerta)
                inserted["alertas"] += 1

            alerta_reciente = models.Alerta(
                cliente_id=cliente.id,
                nivel=demo_alertas[2][0],
                mensaje=demo_alertas[2][1],
                fecha=datetime.utcnow() - timedelta(days=2),
            )
            session.add(alerta_reciente)
            inserted["alertas"] += 1

        for cliente in clientes_map.values():
            for year_offset in range(3):
                year = today.year + year_offset
                exists = (
                    session.query(models.ProyeccionFinanciera)
                    .filter(models.ProyeccionFinanciera.cliente_id == cliente.id)
                    .filter(models.ProyeccionFinanciera.anio == year)
                    .first()
                )
                if exists:
                    continue

                ingreso = 1_850_000 + (cliente.id % 5) * 175_250 + year_offset * 120_500
                costo = ingreso * (0.68 + year_offset * 0.015)
                margen = ingreso - costo
                projection = models.ProyeccionFinanciera(
                    cliente_id=cliente.id,
                    anio=year,
                    ingreso_estimado=round(ingreso, 2),
                    costo_estimado=round(costo, 2),
                    margen_estimado=round(margen, 2),
                )
                session.add(projection)
                inserted["proyecciones_financieras"] += 1

        session.commit()
        return inserted
    finally:
        session.close()


if __name__ == "__main__":
    counts = seed_demo()
    print("Seed demo completado.")
    for key, value in counts.items():
        print(f"{key}: {value}")
