import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Grow, InputAdornment, TextField } from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { exportDashboardKpis, getDashboardKpis, getDashboardTrend } from '../services/dashboardService';
import { createAlerta, getAlertas } from '../services/alertaService';
import ClienteSelect from './ClienteSelect';
import AlertBanner from './AlertBanner';
import LoadingState from './LoadingState';

const nivelConfig = {
  verde: { label: 'Sin riesgo', className: 'badge badge--green' },
  amarillo: { label: 'Riesgo medio', className: 'badge badge--yellow' },
  rojo: { label: 'Riesgo alto', className: 'badge badge--red' }
};

const buildAlertMessage = (kpi) =>
  `Almacenamiento estimado ${kpi.almacenamiento_estimado.toFixed(2)} (cliente ${kpi.cliente_nombre}).`;

const OperacionDashboard = () => {
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
  const activeFilterCount = useMemo(
    () => [clienteId, fechaInicio, fechaFin].filter(Boolean).length,
    [clienteId, fechaInicio, fechaFin]
  );
  const hasActiveFilters = activeFilterCount > 0;

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

  const trendData = useMemo(
    () => trend.map((point) => ({ fecha: point.fecha, volumen: point.volumen_consumido })),
    [trend]
  );

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

  const handleClearFilters = () => {
    setClienteId('');
    setFechaInicio('');
    setFechaFin('');
  };

  return (
  <section className="dashboard space-y-6">
  <header className="dashboard__header flex flex-wrap gap-6">
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
          {hasActiveFilters && (
            <span className="dashboard__filters-indicator">
              Filtros activos: {activeFilterCount}
            </span>
          )}
          <button type="button" onClick={handleExport}>
            Exportar KPIs
          </button>
        </div>
      </header>

  <div className="dashboard__filters gap-6">
        <label>
          Cliente
          <ClienteSelect
            value={clienteId}
            onChange={(event) => setClienteId(event.target.value)}
            includeAll
            allLabel="Todos"
          />
        </label>
        <label>
          Fecha inicio
          <TextField
            type="date"
            value={fechaInicio}
            onChange={(event) => setFechaInicio(event.target.value)}
            aria-label="Fecha inicio"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarTodayOutlinedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </label>
        <label>
          Fecha fin
          <TextField
            type="date"
            value={fechaFin}
            onChange={(event) => setFechaFin(event.target.value)}
            aria-label="Fecha fin"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarTodayOutlinedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </label>
        <label>
          Umbral amarillo
          <TextField
            type="number"
            value={thresholds.amarillo}
            onChange={(event) => setThresholds((prev) => ({ ...prev, amarillo: Number(event.target.value) }))}
            aria-label="Umbral amarillo"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TuneOutlinedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </label>
        <label>
          Umbral rojo
          <TextField
            type="number"
            value={thresholds.rojo}
            onChange={(event) => setThresholds((prev) => ({ ...prev, rojo: Number(event.target.value) }))}
            aria-label="Umbral rojo"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <TuneOutlinedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </label>
        <button
          type="button"
          className="dashboard__clear"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
        >
          Limpiar filtros
        </button>
      </div>

      <div className="dashboard__trend">
        <h3>Tendencia de consumo</h3>
        {!clienteId && <p>Selecciona un cliente para ver su tendencia.</p>}
  <AlertBanner severity="error">{trendError}</AlertBanner>
        {clienteId && trend.length === 0 && !trendError && <p>Sin datos de consumo para este periodo.</p>}
        {trend.length > 0 && (
          <div className="dashboard__trend-chart">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip
                  formatter={(value) => Number(value).toFixed(2)}
                  contentStyle={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    boxShadow: '0 10px 25px -10px rgba(15, 23, 42, 0.2)'
                  }}
                  labelStyle={{ color: '#111827', fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="volumen"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  fill="url(#trendGradient)"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line type="monotone" dataKey="volumen" stroke="#4f46e5" strokeWidth={3} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

  <AlertBanner severity="error">{error}</AlertBanner>

      {!loading && kpiRiesgo.length === 0 && !error && (
        <div className="dashboard__empty">
          <h4>Sin KPIs todavía</h4>
          <p>Registra entregas y consumos para ver métricas y alertas por cliente.</p>
        </div>
      )}

      {loading ? (
        <LoadingState variant="kpi-cards" />
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
                <Grow in timeout={250} key={kpi.cliente_id}>
                  <article className="dashboard__card transition-all duration-200">
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
                </Grow>
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
