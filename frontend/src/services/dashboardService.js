const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getDashboardKpis = async ({ clienteId, fechaInicio, fechaFin } = {}) => {
  const params = new URLSearchParams();
  if (clienteId) params.append('cliente_id', clienteId);
  if (fechaInicio) params.append('fecha_inicio', fechaInicio);
  if (fechaFin) params.append('fecha_fin', fechaFin);

  const response = await fetch(`${API_URL}/dashboard/kpis?${params.toString()}`);
  if (!response.ok) throw new Error('Error al obtener KPIs');
  return response.json();
};

export const exportDashboardKpis = async ({ clienteId, fechaInicio, fechaFin } = {}) => {
  const params = new URLSearchParams();
  if (clienteId) params.append('cliente_id', clienteId);
  if (fechaInicio) params.append('fecha_inicio', fechaInicio);
  if (fechaFin) params.append('fecha_fin', fechaFin);

  const response = await fetch(`${API_URL}/dashboard/kpis/export?${params.toString()}`);
  if (!response.ok) throw new Error('Error al exportar KPIs');
  return response.blob();
};

export const getDashboardTrend = async ({ clienteId, fechaInicio, fechaFin } = {}) => {
  const params = new URLSearchParams();
  if (clienteId) params.append('cliente_id', clienteId);
  if (fechaInicio) params.append('fecha_inicio', fechaInicio);
  if (fechaFin) params.append('fecha_fin', fechaFin);

  const response = await fetch(`${API_URL}/dashboard/trend?${params.toString()}`);
  if (!response.ok) throw new Error('Error al obtener tendencia');
  return response.json();
};
