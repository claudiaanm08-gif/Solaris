const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const createEntrega = async (payload) => {
  const response = await fetch(`${API_URL}/entregas/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Error al registrar entrega');
  return response.json();
};

export const getEntregasByCliente = async (clienteId) => {
  const response = await fetch(`${API_URL}/clientes/${clienteId}/entregas/`);
  if (!response.ok) throw new Error('Error al obtener entregas');
  return response.json();
};
