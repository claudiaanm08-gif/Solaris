import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Grow, InputAdornment, TextField } from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import { exportProyecciones, exportProyeccionesPdf, getProyecciones } from '../services/proyeccionService';
import ClienteSelect from './ClienteSelect';
import AlertBanner from './AlertBanner';
import LoadingState from './LoadingState';

const ProyeccionReabastecimiento = () => {
  const [clienteId, setClienteId] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProyecciones = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getProyecciones({
        clienteId: clienteId || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined
      });
      setData(result);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las proyecciones.');
    } finally {
      setLoading(false);
    }
  }, [clienteId, fechaInicio, fechaFin]);

  useEffect(() => {
    fetchProyecciones();
  }, [fetchProyecciones]);

  const handleExport = async () => {
    try {
      const blob = await exportProyecciones({
        clienteId: clienteId || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'proyecciones_reabastecimiento.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('No se pudo exportar el reporte.');
    }
  };

  const handleExportPdf = async () => {
    try {
      const blob = await exportProyeccionesPdf({
        clienteId: clienteId || undefined,
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'proyecciones_reabastecimiento.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError('No se pudo exportar el PDF.');
    }
  };

  const chartData = useMemo(() => {
    return data
      .map((item) => ({
        id: item.cliente_id,
        name: item.cliente_nombre,
        value: item.dias_para_reabastecimiento ?? 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  return (
  <section className="proyeccion space-y-6">
  <header className="proyeccion__header flex flex-wrap gap-6">
        <div>
          <h2>Proyección de reabastecimiento</h2>
          <p>Estimación basada en consumo histórico para anticipar reposición.</p>
        </div>
        <div className="proyeccion__actions">
          <button type="button" onClick={handleExportPdf}>
            Exportar PDF
          </button>
          <button type="button" onClick={handleExport}>
            Exportar CSV
          </button>
        </div>
      </header>

  <div className="proyeccion__filters gap-6">
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
      </div>

      <AlertBanner severity="error">{error}</AlertBanner>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          {data.length > 0 && (
            <div className="proyeccion__chart">
              <h3>Días estimados para reabastecimiento</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="4 4" />
                    <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip formatter={(value) => `${Number(value).toFixed(1)} días`} />
                    <Bar dataKey="value" fill="#2563eb" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="proyeccion__grid">
            {data.map((item) => (
              <Grow in timeout={250} key={item.cliente_id}>
                <article className="proyeccion__card transition-all duration-200">
                  <h3>{item.cliente_nombre}</h3>
                  <ul>
                    <li>Periodo: {item.periodo_inicio} → {item.periodo_fin}</li>
                    <li>Consumo promedio diario: {item.consumo_promedio_diario.toFixed(2)}</li>
                    <li>Almacenamiento estimado: {item.almacenamiento_estimado.toFixed(2)}</li>
                    <li>Días para reabastecer: {item.dias_para_reabastecimiento?.toFixed(1) ?? 'N/D'}</li>
                    <li>Fecha estimada: {item.fecha_reabastecimiento_estimada ?? 'N/D'}</li>
                  </ul>
                </article>
              </Grow>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default ProyeccionReabastecimiento;
