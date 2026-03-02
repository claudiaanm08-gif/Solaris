const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const reindexRag = async (contratoId) => {
  const response = await fetch(`${API_URL}/rag/reindex`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contrato_id: contratoId || null })
  });
  if (!response.ok) throw new Error('Error al reindexar contratos');
  return response.json();
};

export const queryRag = async ({ pregunta, clienteId, topK }) => {
  const response = await fetch(`${API_URL}/rag/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pregunta,
      cliente_id: clienteId || null,
      top_k: topK || 3
    })
  });
  if (!response.ok) throw new Error('Error al consultar documentos');
  return response.json();
};

export const queryRagSnippets = async ({ query, clienteId, contratoId, clauseType, limit }) => {
  const response = await fetch(`${API_URL}/rag/snippets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      limit: limit || 3,
      cliente_id: clienteId || null,
      contrato_id: contratoId || null,
      clause_type: clauseType || null
    })
  });
  if (!response.ok) throw new Error('Error al consultar fragmentos');
  return response.json();
};
