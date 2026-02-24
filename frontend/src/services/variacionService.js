const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const getVariacionesByCliente = async (clienteId) => {
  const response = await fetch(`${API_URL}/clientes/${clienteId}/variaciones/`);
  if (!response.ok) throw new Error('Error al obtener variaciones');
  return response.json();
};
