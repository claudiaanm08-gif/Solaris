const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getAlertas = async ({ clienteId, limit = 50 } = {}) => {
  const params = new URLSearchParams();
  if (clienteId) params.append('cliente_id', clienteId);
  if (limit) params.append('limit', limit);
  const response = await fetch(`${API_URL}/alertas/?${params.toString()}`);
  if (!response.ok) throw new Error('Error al obtener alertas');
  return response.json();
};

export const createAlerta = async (payload) => {
  const response = await fetch(`${API_URL}/alertas/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Error al guardar alerta');
  return response.json();
};
