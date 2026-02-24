const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const createContrato = async (formData) => {
  const response = await fetch(`${API_URL}/contratos/`, {
    method: 'POST',
    body: formData,  // No poner Content-Type, el navegador lo pone con boundary
  });
  if (!response.ok) throw new Error('Error al crear contrato');
  return response.json();
};

export const getContratosByCliente = async (clienteId) => {
  const response = await fetch(`${API_URL}/clientes/${clienteId}/contratos/`);
  if (!response.ok) throw new Error('Error al obtener contratos');
  return response.json();
};