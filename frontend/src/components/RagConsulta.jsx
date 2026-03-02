import { useState } from 'react';
import { Button, Fade, Grow, InputAdornment, TextField } from '@mui/material';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import { queryRag, reindexRag } from '../services/ragService';
import ClienteSelect from './ClienteSelect';
import { useToast } from './toastContext';

const RagConsulta = () => {
  const [clienteId, setClienteId] = useState('');
  const [pregunta, setPregunta] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [fuentes, setFuentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reindexStatus, setReindexStatus] = useState('');
  const { pushToast } = useToast();

  const handleConsulta = async () => {
    if (!pregunta.trim()) {
      setError('Escribe una pregunta para continuar.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    setReindexStatus('');
    try {
      const data = await queryRag({ pregunta, clienteId: clienteId || undefined, topK: 3 });
      setRespuesta(data.respuesta);
      setFuentes(data.fuentes || []);
      setSuccess('Consulta completada.');
      pushToast('Consulta completada.', 'success');
    } catch (err) {
      console.error(err);
      setError('No se pudo realizar la consulta.');
      pushToast('No se pudo realizar la consulta.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async () => {
    setError('');
    setReindexStatus('Reindexando contratos...');
    try {
      const data = await reindexRag();
      setReindexStatus(`Indexados: ${data.contratos_indexados} contratos · ${data.documentos_indexados} fragmentos`);
      pushToast('Reindexación completada.', 'success');
    } catch (err) {
      console.error(err);
      setError('No se pudo reindexar documentos.');
      pushToast('No se pudo reindexar documentos.', 'error');
    }
  };

  return (
    <section className="rag space-y-6">
  <header className="rag__header flex flex-wrap gap-6">
        <div>
          <h2>Consulta inteligente de contratos</h2>
          <p>Busca información semántica dentro de los PDFs de contratos.</p>
        </div>
        <Button type="button" variant="outlined" onClick={handleReindex} aria-label="Reindexar contratos">
          Reindexar contratos
        </Button>
      </header>

  <div className="rag__filters gap-6">
        <label>
          Cliente (opcional)
          <ClienteSelect
            value={clienteId}
            onChange={(event) => setClienteId(event.target.value)}
            includeAll
            allLabel="Todos"
          />
        </label>
        <label className="rag__full">
          Pregunta
          <TextField
            rows={3}
            multiline
            value={pregunta}
            onChange={(event) => setPregunta(event.target.value)}
            placeholder="Ej. ¿Cuál es el volumen contratado para el cliente X?"
            aria-label="Pregunta"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HelpOutlineOutlinedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </label>
      </div>

      <div className="rag__actions">
        <Button type="button" variant="contained" onClick={handleConsulta} disabled={loading} aria-label="Consultar">
          {loading ? 'Consultando...' : 'Consultar'}
        </Button>
      </div>

      {error && (
        <Fade in timeout={200}>
          <span className="form__helper form__helper--error" role="alert">
            {error}
          </span>
        </Fade>
      )}
      {success && (
        <Fade in timeout={200}>
          <span className="form__helper" role="status">
            {success}
          </span>
        </Fade>
      )}
      {reindexStatus && (
        <Fade in timeout={200}>
          <span className="form__helper" role="status">
            {reindexStatus}
          </span>
        </Fade>
      )}

      {respuesta && (
        <Grow in timeout={250}>
          <div className="rag__respuesta transition-all duration-200">
            <h3>Respuesta</h3>
            <p>{respuesta}</p>
          </div>
        </Grow>
      )}

      {fuentes.length > 0 && (
        <Grow in timeout={250}>
          <div className="rag__fuentes transition-all duration-200">
            <h3>Fuentes</h3>
            <ul>
              {fuentes.map((fuente) => (
                <li key={`${fuente.contrato_id}-${fuente.score}`}>
                  <strong>{fuente.cliente_nombre}</strong> · score {fuente.score.toFixed(2)}
                  <p>{fuente.fragmento}</p>
                </li>
              ))}
            </ul>
          </div>
        </Grow>
      )}
    </section>
  );
};

export default RagConsulta;
