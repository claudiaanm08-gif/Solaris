const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getProyecciones = async ({ clienteId, fechaInicio, fechaFin } = {}) => {
  const params = new URLSearchParams();
  if (clienteId) params.append('cliente_id', clienteId);
  if (fechaInicio) params.append('fecha_inicio', fechaInicio);
  if (fechaFin) params.append('fecha_fin', fechaFin);

  const response = await fetch(`${API_URL}/proyecciones?${params.toString()}`);
  if (!response.ok) throw new Error('Error al obtener proyecciones');
  return response.json();
};

export const exportProyecciones = async ({ clienteId, fechaInicio, fechaFin } = {}) => {
  const params = new URLSearchParams();
  if (clienteId) params.append('cliente_id', clienteId);
  if (fechaInicio) params.append('fecha_inicio', fechaInicio);
  if (fechaFin) params.append('fecha_fin', fechaFin);

  const response = await fetch(`${API_URL}/proyecciones/export?${params.toString()}`);
  if (!response.ok) throw new Error('Error al exportar proyecciones');
  return response.blob();
};

export const exportProyeccionesPdf = async ({ clienteId, fechaInicio, fechaFin } = {}) => {
  const params = new URLSearchParams();
  if (clienteId) params.append('cliente_id', clienteId);
  if (fechaInicio) params.append('fecha_inicio', fechaInicio);
  if (fechaFin) params.append('fecha_fin', fechaFin);

  const response = await fetch(`${API_URL}/proyecciones/export/pdf?${params.toString()}`);
  if (!response.ok) throw new Error('Error al exportar PDF');
  return response.blob();
};
