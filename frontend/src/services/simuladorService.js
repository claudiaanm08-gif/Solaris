const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const simulateAhorro = async (payload) => {
  const response = await fetch(`${API_URL}/simulaciones/ahorro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Error al simular ahorro');
  return response.json();
};

export const downloadPropuesta = async (payload) => {
  const response = await fetch(`${API_URL}/simulaciones/ahorro/propuesta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Error al generar propuesta');
  return response.blob();
};
