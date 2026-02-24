const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const createConsumo = async (payload) => {
  const response = await fetch(`${API_URL}/consumos/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Error al registrar consumo');
  return response.json();
};

export const getConsumosByCliente = async (clienteId) => {
  const response = await fetch(`${API_URL}/clientes/${clienteId}/consumos/`);
  if (!response.ok) throw new Error('Error al obtener consumos');
  return response.json();
};
