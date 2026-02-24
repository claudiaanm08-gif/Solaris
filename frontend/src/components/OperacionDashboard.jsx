import { useCallback, useEffect, useMemo, useState } from 'react';
import { getClientes } from '../services/clienteService';
import { exportDashboardKpis, getDashboardKpis, getDashboardTrend } from '../services/dashboardService';
import { createAlerta, getAlertas } from '../services/alertaService';

const nivelConfig = {
  verde: { label: 'Sin riesgo', className: 'badge badge--green' },
  amarillo: { label: 'Riesgo medio', className: 'badge badge--yellow' },
  rojo: { label: 'Riesgo alto', className: 'badge badge--red' }
};

const buildAlertMessage = (kpi) =>
  `Almacenamiento estimado ${kpi.almacenamiento_estimado.toFixed(2)} (cliente ${kpi.cliente_nombre}).`;

const OperacionDashboard = () => {
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [kpis, setKpis] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [thresholds, setThresholds] = useState({ amarillo: 150, rojo: 50 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trend, setTrend] = useState([]);
  const [trendError, setTrendError] = useState('');
  const [autoAlerts, setAutoAlerts] = useState(true);

  useEffect(() => {
    getClientes().then(setClientes).catch(() => setClientes([]));
  }, []);

  const fetchKpis = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDashboardKpis({
        clienteId: clienteId || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined
      });
      setKpis(data);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los KPIs.');
    } finally {
      setLoading(false);
    }
  }, [clienteId, fechaInicio, fechaFin]);

  const fetchAlertas = useCallback(async () => {
    try {
      const data = await getAlertas({ clienteId: clienteId || undefined });
      setAlertas(data);
    } catch (err) {
      console.error(err);
    }
  }, [clienteId]);

  const fetchTrend = useCallback(async () => {
    if (!clienteId) {
      setTrend([]);
      return;
    }
    setTrendError('');
    try {
      const data = await getDashboardTrend({
        clienteId,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined
      });
      setTrend(data.puntos || []);
    } catch (err) {
      console.error(err);
      setTrendError('No se pudo cargar la tendencia.');
    }
  }, [clienteId, fechaInicio, fechaFin]);

  useEffect(() => {
    fetchKpis();
    fetchAlertas();
    fetchTrend();
  }, [fetchKpis, fetchAlertas, fetchTrend]);

  const trendPath = useMemo(() => {
    if (trend.length < 2) return '';
    const width = 640;
    const height = 160;
    const padding = 20;
    const values = trend.map((point) => point.volumen_consumido);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;
    const xStep = (width - padding * 2) / (trend.length - 1);

    return trend
      .map((point, index) => {
        const x = padding + index * xStep;
        const y = padding + (height - padding * 2) * (1 - (point.volumen_consumido - minValue) / range);
        return `${index === 0 ? 'M' : 'L'}${x},${y}`;
      })
      .join(' ');
  }, [trend]);

  const kpiRiesgo = useMemo(() => {
    return kpis.map((kpi) => {
      const almacenamiento = kpi.almacenamiento_estimado;
      if (almacenamiento <= thresholds.rojo) return { ...kpi, nivel: 'rojo' };
      if (almacenamiento <= thresholds.amarillo) return { ...kpi, nivel: 'amarillo' };
      return { ...kpi, nivel: 'verde' };
    });
  }, [kpis, thresholds]);

  const resumen = useMemo(() => {
    if (kpiRiesgo.length === 0) {
      return {
        clientes: 0,
        almacen: 0,
        margen: 0,
        riesgoRojo: 0,
        riesgoAmarillo: 0
      };
    }
    return kpiRiesgo.reduce(
      (acc, kpi) => {
        acc.clientes += 1;
        acc.almacen += kpi.almacenamiento_estimado;
        acc.margen += kpi.margen_estimado;
        if (kpi.nivel === 'rojo') acc.riesgoRojo += 1;
        if (kpi.nivel === 'amarillo') acc.riesgoAmarillo += 1;
        return acc;
      },
      { clientes: 0, almacen: 0, margen: 0, riesgoRojo: 0, riesgoAmarillo: 0 }
    );
  }, [kpiRiesgo]);

  useEffect(() => {
    if (!autoAlerts || loading) return;
    const existingKeys = new Set(
      alertas.map((alerta) => `${alerta.cliente_id}-${alerta.nivel}-${alerta.mensaje}`)
    );
    const nuevos = kpiRiesgo.filter((kpi) => kpi.nivel !== 'verde');
    if (nuevos.length === 0) return;

    const toCreate = nuevos.filter(
      (kpi) => !existingKeys.has(`${kpi.cliente_id}-${kpi.nivel}-${buildAlertMessage(kpi)}`)
    );
    if (toCreate.length === 0) return;

    const create = async () => {
      try {
        await Promise.all(
          toCreate.map((kpi) =>
            createAlerta({
              cliente_id: kpi.cliente_id,
              nivel: kpi.nivel,
              mensaje: buildAlertMessage(kpi)
            })
          )
        );
        fetchAlertas();
      } catch (err) {
        console.error(err);
        setError('No se pudieron guardar las alertas.');
      }
    };

    create();
  }, [autoAlerts, alertas, fetchAlertas, kpiRiesgo, loading]);

  const handleExport = async () => {
    try {
      const blob = await exportDashboardKpis({
        clienteId: clienteId || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'dashboard_kpis.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('No se pudo exportar el reporte.');
    }
  };

  return (
    <section className="dashboard">
      <header className="dashboard__header">
        <div>
          <h2>Dashboard operativo</h2>
          <p>KPIs y alertas de riesgo por cliente.</p>
        </div>
        <div className="dashboard__actions">
          <label className="dashboard__toggle">
            <input
              type="checkbox"
              checked={autoAlerts}
              onChange={(event) => setAutoAlerts(event.target.checked)}
            />
            Alertas automáticas
          </label>
          <button type="button" onClick={handleExport}>
            Exportar KPIs
          </button>
        </div>
      </header>

      <div className="dashboard__filters">
        <label>
          Cliente
          <select value={clienteId} onChange={(event) => setClienteId(event.target.value)}>
            <option value="">Todos</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha inicio
          <input type="date" value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value)} />
        </label>
        <label>
          Fecha fin
          <input type="date" value={fechaFin} onChange={(event) => setFechaFin(event.target.value)} />
        </label>
        <label>
          Umbral amarillo
          <input
            type="number"
            value={thresholds.amarillo}
            onChange={(event) => setThresholds((prev) => ({ ...prev, amarillo: Number(event.target.value) }))}
          />
        </label>
        <label>
          Umbral rojo
          <input
            type="number"
            value={thresholds.rojo}
            onChange={(event) => setThresholds((prev) => ({ ...prev, rojo: Number(event.target.value) }))}
          />
        </label>
      </div>

      <div className="dashboard__trend">
        <h3>Tendencia de consumo</h3>
        {!clienteId && <p>Selecciona un cliente para ver su tendencia.</p>}
        {trendError && <p className="dashboard__error">{trendError}</p>}
        {clienteId && trend.length === 0 && !trendError && <p>Sin datos de consumo para este periodo.</p>}
        {trend.length > 0 && (
          <div className="dashboard__trend-chart">
            <svg viewBox="0 0 640 160" role="img" aria-label="Tendencia de consumo">
              <path d={trendPath} fill="none" stroke="#2563eb" strokeWidth="3" />
              {trend.map((point, index) => {
                const xStep = (640 - 40) / (trend.length - 1 || 1);
                const x = 20 + index * xStep;
                const values = trend.map((p) => p.volumen_consumido);
                const maxValue = Math.max(...values, 1);
                const minValue = Math.min(...values, 0);
                const range = maxValue - minValue || 1;
                const y = 20 + (160 - 40) * (1 - (point.volumen_consumido - minValue) / range);
                return <circle key={point.fecha} cx={x} cy={y} r="4" fill="#1d4ed8" />;
              })}
            </svg>
            <div className="dashboard__trend-legend">
              {trend.map((point) => (
                <span key={point.fecha}>
                  {point.fecha}: {point.volumen_consumido.toFixed(2)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className="dashboard__error">{error}</p>}

      {!loading && kpiRiesgo.length === 0 && !error && (
        <div className="dashboard__empty">
          <h4>Sin KPIs todavía</h4>
          <p>Registra entregas y consumos para ver métricas y alertas por cliente.</p>
        </div>
      )}

      {loading ? (
        <p>Cargando KPIs...</p>
      ) : (
        <>
          <div className="dashboard__summary">
            <div>
              <span>Clientes activos</span>
              <strong>{resumen.clientes}</strong>
            </div>
            <div>
              <span>Almacenamiento total</span>
              <strong>{resumen.almacen.toFixed(2)}</strong>
            </div>
            <div>
              <span>Margen estimado</span>
              <strong>{resumen.margen.toFixed(2)}</strong>
            </div>
            <div>
              <span>Riesgo alto</span>
              <strong>{resumen.riesgoRojo}</strong>
            </div>
            <div>
              <span>Riesgo medio</span>
              <strong>{resumen.riesgoAmarillo}</strong>
            </div>
          </div>

          <div className="dashboard__grid">
            {kpiRiesgo.map((kpi) => {
              const config = nivelConfig[kpi.nivel];
              return (
                <article key={kpi.cliente_id} className="dashboard__card">
                  <div className="dashboard__card-header">
                    <h3>{kpi.cliente_nombre}</h3>
                    <span className={config.className}>{config.label}</span>
                  </div>
                  <ul>
                    <li>Volumen contratado: {kpi.volumen_contratado.toFixed(2)}</li>
                    <li>Volumen entregado: {kpi.volumen_entregado.toFixed(2)}</li>
                    <li>Volumen consumido: {kpi.volumen_consumido.toFixed(2)}</li>
                    <li>
                      Almacenamiento estimado: <strong>{kpi.almacenamiento_estimado.toFixed(2)}</strong>
                    </li>
                    <li>Margen estimado: {kpi.margen_estimado.toFixed(2)}</li>
                  </ul>
                </article>
              );
            })}
          </div>
        </>
      )}

      <div className="dashboard__alerts">
        <h3>Alertas recientes</h3>
        {alertas.length === 0 ? (
          <p>Sin alertas registradas.</p>
        ) : (
          <ul>
            {alertas.map((alerta) => (
              <li key={alerta.id}>
                <span className={nivelConfig[alerta.nivel]?.className || 'badge'}>{alerta.nivel}</span>
                <span>{alerta.mensaje}</span>
                <small>{new Date(alerta.fecha).toLocaleString()}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default OperacionDashboard;
